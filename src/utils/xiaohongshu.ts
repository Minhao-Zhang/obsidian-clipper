import { escapeHtml } from './string-utils';

export interface XiaohongshuExtraction {
	noteId: string;
	title: string;
	author: string;
	description: string;
	contentText: string;
	contentHtml: string;
	image: string;
	images: string[];
	imageMarkdown: string;
	video: string;
	noteType: string;
	tags: string[];
	tagsText: string;
	published: string;
	likes: string;
	collects: string;
	comments: string;
	variables: Record<string, string>;
}

const INITIAL_STATE_RE = /window\.__INITIAL_STATE__\s*=/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function asCount(value: unknown): string {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	if (typeof value === 'string') return value.trim();
	return '';
}

function normalizeText(value: string): string {
	return value
		.replace(/\[话题\]/g, '')
		.replace(/\r\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function extractInitialState(document: Document): Record<string, unknown> | null {
	const scripts = Array.from(document.querySelectorAll('script'));
	for (const script of scripts) {
		const text = script.textContent || '';
		const markerMatch = text.match(INITIAL_STATE_RE);
		if (!markerMatch || markerMatch.index === undefined) continue;

		let json = text.slice(markerMatch.index + markerMatch[0].length).trim();
		if (json.endsWith(';')) {
			json = json.slice(0, -1).trim();
		}
		json = json.replace(/\bundefined\b/g, 'null');

		try {
			const parsed = JSON.parse(json);
			return isRecord(parsed) ? parsed : null;
		} catch (error) {
			console.warn('[Obsidian Clipper] Failed to parse Xiaohongshu initial state:', error);
			return null;
		}
	}
	return null;
}

function getNoteEntry(state: Record<string, unknown>, preferredNoteId = ''): { noteId: string; note: Record<string, unknown> } | null {
	const noteState = isRecord(state.note) ? state.note : null;
	const detailMap = noteState && isRecord(noteState.noteDetailMap) ? noteState.noteDetailMap : null;
	if (!detailMap) return null;

	if (preferredNoteId && isRecord(detailMap[preferredNoteId])) {
		const detail = detailMap[preferredNoteId];
		const note = isRecord(detail.note) ? detail.note : detail;
		if (isRecord(note)) {
			return { noteId: preferredNoteId, note };
		}
	}

	for (const [noteId, detail] of Object.entries(detailMap)) {
		if (!isRecord(detail)) continue;
		const note = isRecord(detail.note) ? detail.note : detail;
		if (isRecord(note)) {
			return { noteId, note };
		}
	}
	return null;
}

function firstString(...values: unknown[]): string {
	for (const value of values) {
		const str = asString(value);
		if (str) return str;
	}
	return '';
}

function getImageUrl(image: unknown): string {
	if (!isRecord(image)) return '';
	const infoList = Array.isArray(image.infoList) ? image.infoList : [];
	const infoUrls = infoList
		.map(info => isRecord(info) ? firstString(info.url, info.imageScene) : '')
		.filter(Boolean);
	return firstString(image.urlDefault, image.urlPre, image.url, image.original, ...infoUrls);
}

function getImages(note: Record<string, unknown>): string[] {
	const rawImages = Array.isArray(note.imageList) ? note.imageList : [];
	const seen = new Set<string>();
	const images: string[] = [];
	for (const image of rawImages) {
		const url = getImageUrl(image);
		if (url && /^https?:\/\//.test(url) && !seen.has(url)) {
			seen.add(url);
			images.push(url);
		}
	}
	return images;
}

function getVideoUrl(note: Record<string, unknown>): string {
	const video = isRecord(note.video) ? note.video : null;
	const media = video && isRecord(video.media) ? video.media : null;
	const stream = media && isRecord(media.stream) ? media.stream : null;
	if (!stream) return '';

	for (const key of ['h264', 'h265', 'av1']) {
		const streams = Array.isArray(stream[key]) ? stream[key] : [];
		for (const item of streams) {
			if (!isRecord(item)) continue;
			const backupUrls = Array.isArray(item.backupUrls) ? item.backupUrls : [];
			const url = firstString(item.masterUrl, ...backupUrls);
			if (url) return url;
		}
	}
	return '';
}

function getPublished(note: Record<string, unknown>): string {
	const raw = note.time ?? note.lastUpdateTime ?? note.createTime ?? note.publishTime;
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		const ms = raw > 100000000000 ? raw : raw * 1000;
		return new Date(ms).toISOString();
	}
	return asString(raw);
}

function getTags(note: Record<string, unknown>, contentText: string): string[] {
	const tagList = Array.isArray(note.tagList) ? note.tagList : [];
	const tags = tagList
		.map(tag => isRecord(tag) ? firstString(tag.name, tag.tagName) : asString(tag))
		.filter(Boolean);

	const textTags = Array.from(contentText.matchAll(/#([^#\s]+?)(?:\[话题\])?#|#([^\s#]+)/g))
		.map(match => (match[1] || match[2] || '').trim())
		.filter(Boolean);

	return Array.from(new Set([...tags, ...textTags]));
}

function buildDescriptionHtml(contentText: string): string {
	return contentText
		.split(/\n+/)
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => `<p>${escapeHtml(line)}</p>`)
		.join('\n');
}

function buildContentHtml(data: {
	title: string;
	author: string;
	contentText: string;
	images: string[];
	video: string;
	tags: string[];
}): string {
	const parts: string[] = ['<article class="xiaohongshu-note">'];
	if (data.title) parts.push(`<h1>${escapeHtml(data.title)}</h1>`);
	if (data.author) parts.push(`<p><strong>Author:</strong> ${escapeHtml(data.author)}</p>`);
	if (data.video) {
		parts.push(`<video controls src="${escapeHtml(data.video)}"></video>`);
	}
	if (data.contentText) {
		parts.push(buildDescriptionHtml(data.contentText));
	}
	for (const image of data.images) {
		parts.push(`<img src="${escapeHtml(image)}" alt="${escapeHtml(data.title || 'Xiaohongshu image')}" />`);
	}
	if (data.tags.length > 0) {
		parts.push(`<p>${data.tags.map(tag => `#${escapeHtml(tag)}`).join(' ')}</p>`);
	}
	parts.push('</article>');
	return parts.join('\n');
}

function getUrlNoteId(url: URL): string {
	const parts = url.pathname.split('/').filter(Boolean);
	const knownPrefixes = new Set(['explore', 'discovery', 'item', 'search_result']);
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i];
		if (!knownPrefixes.has(part) && /^[a-zA-Z0-9]+$/.test(part)) return part;
	}
	return '';
}

function cleanDomText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function textFrom(root: ParentNode, selectors: string[]): string {
	for (const selector of selectors) {
		const text = cleanDomText(root.querySelector(selector)?.textContent || '');
		if (text) return text;
	}
	return '';
}

function findPostRoot(document: Document): Element | Document {
	return document.querySelector('.note-detail-mask .note-container')
		|| document.querySelector('.note-container')
		|| document.querySelector('[class*="note-detail"]')
		|| document;
}

function getDomImages(root: ParentNode): string[] {
	const mediaRoot = root.querySelector('.media-container, [class*="media-container"], .swiper, [class*="swiper"]') || root;
	const seen = new Set<string>();
	const images: string[] = [];
	for (const img of Array.from(mediaRoot.querySelectorAll('img'))) {
		const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
		if (!/^https?:\/\//.test(src)) continue;
		if (/avatar|profile|icon|emoji/i.test(src)) continue;
		if (!seen.has(src)) {
			seen.add(src);
			images.push(src);
		}
	}
	return images;
}

function getDomVideo(root: ParentNode): string {
	const video = root.querySelector('video');
	if (!video) return '';
	return firstString(video.getAttribute('src'), video.querySelector('source')?.getAttribute('src'));
}

function getDomTags(contentText: string): string[] {
	return Array.from(contentText.matchAll(/#([^#\s]+?)(?:\[话题\])?#|#([^\s#]+)/g))
		.map(match => (match[1] || match[2] || '').trim())
		.filter(Boolean);
}

function getDomExtraction(document: Document, noteId: string): Omit<XiaohongshuExtraction, 'variables'> | null {
	const root = findPostRoot(document);
	const title = textFrom(root, ['#detail-title', '.note-content .title', '.title']);
	const author = textFrom(root, ['.author-container .name', '.author .name', '.username', '.user-name']);
	const rawDesc = textFrom(root, ['#detail-desc', '.note-content .desc', '.desc']);
	const contentText = normalizeText(rawDesc);
	const images = getDomImages(root);
	const video = getDomVideo(root);
	const tags = getDomTags(rawDesc);
	const likes = textFrom(root, ['.interact-container .like-wrapper .count', '.like-wrapper .count']);
	const collects = textFrom(root, ['.interact-container .collect-wrapper .count', '.collect-wrapper .count']);
	const comments = textFrom(root, ['.interact-container .chat-wrapper .count', '.chat-wrapper .count']);
	const published = textFrom(root, ['.note-content .date', '.date']);

	if (!title && !contentText && images.length === 0 && !video) return null;

	return {
		noteId,
		title,
		author,
		description: contentText,
		contentText,
		contentHtml: buildContentHtml({ title, author, contentText, images, video, tags }),
		image: images[0] || '',
		images,
		imageMarkdown: images.map(image => `![${title || 'Xiaohongshu image'}](${image})`).join('\n'),
		video,
		noteType: video ? 'video' : 'normal',
		tags,
		tagsText: tags.map(tag => `#${tag}`).join(' '),
		published,
		likes,
		collects,
		comments,
	};
}

function mergePreferDom(
	stateData: Omit<XiaohongshuExtraction, 'variables'> | null,
	domData: Omit<XiaohongshuExtraction, 'variables'> | null
): Omit<XiaohongshuExtraction, 'variables'> | null {
	if (!stateData) return domData;
	if (!domData) return stateData;
	return {
		noteId: domData.noteId || stateData.noteId,
		title: domData.title || stateData.title,
		author: domData.author || stateData.author,
		description: domData.description || stateData.description,
		contentText: domData.contentText || stateData.contentText,
		contentHtml: domData.contentHtml || stateData.contentHtml,
		image: domData.image || stateData.image,
		images: domData.images.length > 0 ? domData.images : stateData.images,
		imageMarkdown: domData.imageMarkdown || stateData.imageMarkdown,
		video: domData.video || stateData.video,
		noteType: domData.noteType || stateData.noteType,
		tags: domData.tags.length > 0 ? domData.tags : stateData.tags,
		tagsText: domData.tagsText || stateData.tagsText,
		published: domData.published || stateData.published,
		likes: domData.likes || stateData.likes,
		collects: domData.collects || stateData.collects,
		comments: domData.comments || stateData.comments,
	};
}

export function extractXiaohongshu(document: Document): XiaohongshuExtraction | null {
	let url: URL;
	try {
		url = new URL(document.URL);
	} catch {
		return null;
	}
	if (!url.hostname.includes('xiaohongshu.com')) return null;

	const urlNoteId = getUrlNoteId(url);
	const state = extractInitialState(document);
	const entry = state ? getNoteEntry(state, urlNoteId) : null;
	let stateData: Omit<XiaohongshuExtraction, 'variables'> | null = null;
	if (entry) {
		const { noteId, note } = entry;
		const user = isRecord(note.user) ? note.user : {};
		const interactInfo = isRecord(note.interactInfo) ? note.interactInfo : {};
		const title = firstString(note.title, document.querySelector('#detail-title')?.textContent, document.title.replace(/\s*-\s*小红书.*$/, ''));
		const author = firstString(user.nickname, user.nickName, document.querySelector('.author .name, .username')?.textContent);
		const rawDesc = firstString(note.desc, document.querySelector('#detail-desc')?.textContent);
		const contentText = normalizeText(rawDesc);
		const images = getImages(note);
		const video = getVideoUrl(note);
		const noteType = firstString(note.type, video ? 'video' : 'normal');
		const tags = getTags(note, rawDesc);
		const imageMarkdown = images.map(image => `![${title || 'Xiaohongshu image'}](${image})`).join('\n');
		const tagsText = tags.map(tag => `#${tag}`).join(' ');
		const contentHtml = buildContentHtml({ title, author, contentText, images, video, tags });
		stateData = {
			noteId,
			title,
			author,
			description: contentText,
			contentText,
			contentHtml,
			image: images[0] || '',
			images,
			imageMarkdown,
			video,
			noteType,
			tags,
			tagsText,
			published: getPublished(note),
			likes: asCount(interactInfo.likedCount ?? interactInfo.likeCount),
			collects: asCount(interactInfo.collectedCount ?? interactInfo.collectCount),
			comments: asCount(interactInfo.commentCount),
		};
	}

	const domData = getDomExtraction(document, urlNoteId || entry?.noteId || '');
	const data = mergePreferDom(stateData, domData);
	if (!data) return null;

	const extraction: XiaohongshuExtraction = {
		...data,
		variables: {},
	};

	extraction.variables = {
		xhsNoteId: extraction.noteId,
		xhsTitle: extraction.title,
		xhsAuthor: extraction.author,
		xhsContent: extraction.contentText,
		xhsImages: extraction.images.join('\n'),
		xhsImageMarkdown: extraction.imageMarkdown,
		xhsVideo: extraction.video,
		xhsNoteType: extraction.noteType,
		xhsTags: extraction.tagsText,
		xhsPublished: extraction.published,
		xhsLikes: extraction.likes,
		xhsCollects: extraction.collects,
		xhsComments: extraction.comments,
	};

	return extraction;
}
