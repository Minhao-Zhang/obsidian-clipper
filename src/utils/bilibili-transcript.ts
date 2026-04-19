import { escapeHtml } from './string-utils';

/** Runtime message action — keep in sync with background + content handlers. */
export const BILIBILI_TRANSCRIPT_MESSAGE_ACTION = 'fetchBilibiliTranscript' as const;

export interface BilibiliTranscriptPayload {
	/** Plain text for `{{transcript}}` / templates */
	transcript: string;
	/** HTML block appended to article content (Defuddle-style segments) */
	transcriptHtml: string;
}

/** Response shape for `browser.runtime.sendMessage` from background. */
export type FetchBilibiliTranscriptResponse =
	| { success: true; payload: BilibiliTranscriptPayload | null }
	| { success: false; error: string };

const BVID_RE = /BV[\w]+/i;
const BILIBILI_API = 'https://api.bilibili.com';

interface BilibiliSubtitleTrack {
	subtitle_url?: string;
	lan?: string;
	lan_doc?: string;
}

interface BilibiliViewPage {
	cid: number;
}

interface BilibiliViewData {
	pages?: BilibiliViewPage[];
}

interface BilibiliViewJson {
	code: number;
	data?: BilibiliViewData;
}

interface BilibiliPlayerData {
	subtitle?: { subtitles?: BilibiliSubtitleTrack[] };
}

interface BilibiliPlayerJson {
	code: number;
	data?: BilibiliPlayerData;
}

function formatTimestamp(seconds: number): string {
	const s = Math.max(0, seconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = Math.floor(s % 60);
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}
	return `${m}:${String(sec).padStart(2, '0')}`;
}

function bilibiliApiHeaders(pageUrl: string): HeadersInit {
	return {
		Accept: 'application/json',
		'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : 'ObsidianWebClipper/1.0',
		Referer: pageUrl,
	};
}

function rankSubtitleTrack(lan: string, lanDoc: string): number {
	const t = `${lan || ''} ${lanDoc || ''}`.toLowerCase();
	if (t.includes('zh') || t.includes('中文') || t.includes('汉语')) return 0;
	if (t.includes('ai')) return 1;
	if (t.includes('en') || t.includes('英文')) return 2;
	return 5;
}

function pickSubtitleTrack(tracks: BilibiliSubtitleTrack[]): BilibiliSubtitleTrack | null {
	if (!Array.isArray(tracks) || tracks.length === 0) return null;
	return [...tracks].sort(
		(a, b) =>
			rankSubtitleTrack(String(a.lan || ''), String(a.lan_doc || '')) -
			rankSubtitleTrack(String(b.lan || ''), String(b.lan_doc || ''))
	)[0];
}

function normalizeSubtitleUrl(url: string): string {
	if (url.startsWith('//')) return `https:${url}`;
	return url;
}

/** Bilibili subtitle JSON: top-level `body` array of { from, content }. */
function parseSubtitleJson(json: unknown): { from: number; text: string }[] {
	if (!json || typeof json !== 'object') return [];
	const obj = json as { body?: unknown };
	const raw = Array.isArray(obj.body) ? obj.body : Array.isArray(json) ? json : null;
	if (!raw) return [];
	const out: { from: number; text: string }[] = [];
	for (const row of raw) {
		if (row && typeof row === 'object' && typeof (row as { from?: unknown }).from === 'number' &&
			typeof (row as { content?: unknown }).content === 'string') {
			const r = row as { from: number; content: string };
			out.push({ from: r.from, text: r.content });
		}
	}
	return out;
}

function buildTranscriptPayload(segments: { from: number; text: string }[]): BilibiliTranscriptPayload | null {
	if (segments.length === 0) return null;
	const htmlParts: string[] = [];
	const textLines: string[] = [];
	for (const seg of segments) {
		const ts = formatTimestamp(seg.from);
		const safe = escapeHtml(seg.text);
		htmlParts.push(
			`<p class="transcript-segment"><strong><span class="timestamp" data-timestamp="${seg.from}">${ts}</span></strong> · ${safe}</p>`
		);
		textLines.push(`**${ts}** · ${seg.text}`);
	}
	return {
		transcript: textLines.join('\n'),
		transcriptHtml: `<div class="bilibili transcript">\n<h2>Transcript</h2>\n${htmlParts.join('\n')}\n</div>`,
	};
}

async function parseJsonResponse<T>(res: Response): Promise<T | null> {
	if (!res.ok) return null;
	try {
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

/**
 * Fetch Bilibili subtitles via api.bilibili.com.
 * Call from the extension **background/service worker** (host_permissions bypass page CORS).
 * Content scripts should use runtime.sendMessage → background instead of calling this directly.
 *
 * Known limits: only `/video/` pages with BV ids; no WBI-signed player API fallback if Bilibili
 * tightens `x/player/v2`; empty subtitles return null (not an error).
 */
export async function tryFetchBilibiliTranscript(pageUrl: string): Promise<BilibiliTranscriptPayload | null> {
	let urlObj: URL;
	try {
		urlObj = new URL(pageUrl);
	} catch {
		return null;
	}
	if (!urlObj.hostname.includes('bilibili.com')) {
		return null;
	}
	if (!urlObj.pathname.includes('/video/')) return null;

	const bvidMatch = pageUrl.match(BVID_RE);
	if (!bvidMatch) return null;
	const bvid = bvidMatch[0];

	const pRaw = parseInt(urlObj.searchParams.get('p') || '1', 10);
	const p = Number.isFinite(pRaw) && pRaw > 0 ? pRaw : 1;

	const headers = bilibiliApiHeaders(pageUrl);

	const viewRes = await fetch(
		`${BILIBILI_API}/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
		{ credentials: 'include', headers }
	);
	const viewJson = await parseJsonResponse<BilibiliViewJson>(viewRes);
	if (!viewJson || viewJson.code !== 0 || !viewJson.data?.pages?.length) return null;

	const pages = viewJson.data.pages;
	const idx = Math.min(p - 1, pages.length - 1);
	const cid = pages[idx]?.cid;
	if (!cid) return null;

	const playerRes = await fetch(
		`${BILIBILI_API}/x/player/v2?bvid=${encodeURIComponent(bvid)}&cid=${cid}`,
		{ credentials: 'include', headers }
	);
	const playerJson = await parseJsonResponse<BilibiliPlayerJson>(playerRes);
	if (!playerJson || playerJson.code !== 0) return null;

	const track = pickSubtitleTrack(playerJson.data?.subtitle?.subtitles || []);
	if (!track?.subtitle_url) return null;

	const subUrl = normalizeSubtitleUrl(String(track.subtitle_url));
	const subRes = await fetch(subUrl, { credentials: 'include', headers });
	const subJson = await parseJsonResponse<unknown>(subRes);
	if (subJson === null) return null;
	const segments = parseSubtitleJson(subJson);
	return buildTranscriptPayload(segments);
}
