import { escapeHtml } from './string-utils';

export interface OutlookExtraction {
	subject: string;
	from: string;
	fromEmail: string;
	to: string;
	cc: string;
	received: string;
	bodyText: string;
	bodyHtml: string;
	contentHtml: string;
	variables: Record<string, string>;
}

const OUTLOOK_HOST_RE = /(^|\.)outlook\.(live|office|office365)\.com$|^outlook\.cloud\.microsoft$|(^|\.)office\.com$|(^|\.)office365\.com$|(^|\.)mail\.office365\.com$/i;

function cleanText(value: string): string {
	return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function textFrom(root: ParentNode, selectors: string[]): string {
	for (const selector of selectors) {
		const el = root.querySelector(selector);
		const text = cleanText(el?.textContent || '');
		if (text) return text;
	}
	return '';
}

function attrFrom(root: ParentNode, selectors: string[], attr: string): string {
	for (const selector of selectors) {
		const value = root.querySelector(selector)?.getAttribute(attr) || '';
		if (value.trim()) return value.trim();
	}
	return '';
}

function firstMatching(root: ParentNode, selectors: string[]): Element | null {
	for (const selector of selectors) {
		const el = root.querySelector(selector);
		if (el) return el;
	}
	return null;
}

function isHidden(el: Element): boolean {
	const ariaHidden = el.getAttribute('aria-hidden');
	const hidden = el.hasAttribute('hidden');
	const style = el.getAttribute('style') || '';
	return hidden || ariaHidden === 'true' || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style);
}

function findMessageRoot(document: Document): ParentNode {
	return firstMatching(document, [
		'[data-testid="ReadingPane"]',
		'[data-testid="ConversationReadingPane"]',
		'[data-app-section="ReadingPane"]',
		'[role="main"]',
		'main',
	]) || document;
}

function findBodyElement(root: ParentNode): Element | null {
	const direct = firstMatching(root, [
		'[data-testid="messageBody"]',
		'[data-testid="MessageBody"]',
		'[aria-label="Message body"]',
		'[aria-label^="Message body"]',
		'[role="document"]',
		'.allowTextSelection',
	]);
	if (direct && cleanText(direct.textContent || '')) return direct;

	const candidates = Array.from(root.querySelectorAll('div, article, section'))
		.filter(el => !isHidden(el))
		.map(el => ({ el, text: cleanText(el.textContent || '') }))
		.filter(({ text }) => text.length > 40)
		.sort((a, b) => b.text.length - a.text.length);
	return candidates[0]?.el || null;
}

function sanitizeBodyHtml(body: Element): string {
	const clone = body.cloneNode(true) as Element;
	clone.querySelectorAll('script, style, svg, button, input, textarea, select').forEach(el => el.remove());
	clone.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
	clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
	return clone.outerHTML;
}

function extractEmail(raw: string): string {
	const decoded = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
	const match = decoded.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	return match?.[0] || '';
}

function fieldValue(root: ParentNode, label: string): string {
	const labelRe = new RegExp(`^${label}:?$`, 'i');
	for (const el of Array.from(root.querySelectorAll('[aria-label], [title], span, div'))) {
		const attr = el.getAttribute('aria-label') || el.getAttribute('title') || '';
		if (attr.toLowerCase().startsWith(`${label.toLowerCase()}:`)) {
			return cleanText(attr.slice(label.length + 1));
		}
		const text = cleanText(el.textContent || '');
		if (labelRe.test(text)) {
			let sibling = el.nextElementSibling;
			while (sibling) {
				const value = cleanText(sibling.textContent || '');
				if (value) return value;
				sibling = sibling.nextElementSibling;
			}
		}
	}
	return '';
}

function buildContentHtml(data: Omit<OutlookExtraction, 'variables' | 'contentHtml'>): string {
	const parts = ['<article class="outlook-email">'];
	if (data.subject) parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
	const meta: string[] = [];
	if (data.from) meta.push(`<p><strong>From:</strong> ${escapeHtml(data.from)}</p>`);
	if (data.fromEmail) meta.push(`<p><strong>From email:</strong> ${escapeHtml(data.fromEmail)}</p>`);
	if (data.to) meta.push(`<p><strong>To:</strong> ${escapeHtml(data.to)}</p>`);
	if (data.cc) meta.push(`<p><strong>Cc:</strong> ${escapeHtml(data.cc)}</p>`);
	if (data.received) meta.push(`<p><strong>Received:</strong> ${escapeHtml(data.received)}</p>`);
	parts.push(...meta);
	if (data.bodyHtml) parts.push(data.bodyHtml);
	parts.push('</article>');
	return parts.join('\n');
}

export function extractOutlook(document: Document): OutlookExtraction | null {
	let url: URL;
	try {
		url = new URL(document.URL);
	} catch {
		return null;
	}
	if (!OUTLOOK_HOST_RE.test(url.hostname)) return null;

	const root = findMessageRoot(document);
	const body = findBodyElement(root);
	if (!body) return null;

	const subject = textFrom(root, [
		'[data-testid="messageSubject"]',
		'[data-testid="MessageSubject"]',
		'[aria-label^="Subject"]',
		'h1',
		'[role="heading"][aria-level="1"]',
		'[role="heading"]',
	]);
	const from = textFrom(root, [
		'[data-testid="messageHeaderSender"]',
		'[data-testid="MessageHeaderSender"]',
		'[aria-label^="From:"]',
		'[title^="From:"]',
		'[aria-label*="Sender"]',
	]) || fieldValue(root, 'From');
	const fromEmail = extractEmail(
		attrFrom(root, ['[data-testid="messageHeaderSender"]', '[aria-label^="From:"]', '[title^="From:"]'], 'aria-label')
		|| attrFrom(root, ['[data-testid="messageHeaderSender"]', '[aria-label^="From:"]', '[title^="From:"]'], 'title')
		|| from
	);
	const to = fieldValue(root, 'To');
	const cc = fieldValue(root, 'Cc');
	const received = attrFrom(root, ['time', '[data-testid="messageHeaderDate"]', '[title*=","]'], 'datetime')
		|| textFrom(root, ['time', '[data-testid="messageHeaderDate"]', '[aria-label^="Sent:"]'])
		|| fieldValue(root, 'Sent')
		|| fieldValue(root, 'Date');
	const bodyHtml = sanitizeBodyHtml(body);
	const bodyText = cleanText(body.textContent || '');

	if (!subject && !from && !bodyText) return null;

	const base: Omit<OutlookExtraction, 'variables' | 'contentHtml'> = {
		subject,
		from,
		fromEmail,
		to,
		cc,
		received,
		bodyText,
		bodyHtml,
	};
	const contentHtml = buildContentHtml(base);
	const variables = {
		outlookSubject: subject,
		outlookFrom: from,
		outlookFromEmail: fromEmail,
		outlookTo: to,
		outlookCc: cc,
		outlookReceived: received,
		outlookBody: bodyText,
		outlookBodyHtml: bodyHtml,
	};

	return {
		...base,
		contentHtml,
		variables,
	};
}
