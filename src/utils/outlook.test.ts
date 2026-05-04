import { describe, expect, test } from 'vitest';
import { parseHTML } from 'linkedom';
import { extractOutlook } from './outlook';

function createDocument(html: string, url: string): Document {
	const { document } = parseHTML(html);
	Object.defineProperty(document, 'URL', {
		value: url,
		configurable: true,
	});
	return document as unknown as Document;
}

describe('extractOutlook', () => {
	test('extracts the open message from semantic Outlook markup', () => {
		const document = createDocument(`
			<html>
				<body>
					<div data-testid="MessageList">
						<div>Background message that should not be clipped</div>
					</div>
					<main role="main" data-testid="ReadingPane">
						<h1 data-testid="messageSubject">Fixture subject</h1>
						<div data-testid="messageHeaderSender" aria-label="From: Sender Name <sender@example.invalid>">
							Sender Name
						</div>
						<div>
							<span>To:</span><span>Recipient Name &lt;recipient@example.invalid&gt;</span>
						</div>
						<div>
							<span>Cc:</span><span>Copy Name &lt;copy@example.invalid&gt;</span>
						</div>
						<time datetime="2026-01-02T03:04:00Z">Jan 2</time>
						<div aria-label="Message body">
							<p>First paragraph of the fixture email.</p>
							<p>Second paragraph of the fixture email.</p>
							<button>Reply</button>
						</div>
					</main>
				</body>
			</html>
		`, 'https://outlook.office.com/mail/inbox/id/fixture');

		const result = extractOutlook(document);

		expect(result).not.toBeNull();
		expect(result?.subject).toBe('Fixture subject');
		expect(result?.from).toBe('Sender Name');
		expect(result?.fromEmail).toBe('sender@example.invalid');
		expect(result?.to).toBe('Recipient Name <recipient@example.invalid>');
		expect(result?.cc).toBe('Copy Name <copy@example.invalid>');
		expect(result?.received).toBe('2026-01-02T03:04:00Z');
		expect(result?.bodyText).toContain('First paragraph of the fixture email.');
		expect(result?.bodyText).not.toContain('Background message');
		expect(result?.bodyHtml).not.toContain('<button');
		expect(result?.variables.outlookSubject).toBe('Fixture subject');
	});

	test('returns null outside Outlook hosts', () => {
		const document = createDocument('<html><body><main role="main">Email body</main></body></html>', 'https://example.invalid/mail');
		expect(extractOutlook(document)).toBeNull();
	});

	test('supports the cloud.microsoft Outlook host', () => {
		const document = createDocument(`
			<html>
				<body>
					<main role="main">
						<h1>Cloud host subject</h1>
						<div aria-label="Message body">Cloud host message body fixture.</div>
					</main>
				</body>
			</html>
		`, 'https://outlook.cloud.microsoft/mail/inbox/id/fixture');

		expect(extractOutlook(document)?.subject).toBe('Cloud host subject');
	});
});
