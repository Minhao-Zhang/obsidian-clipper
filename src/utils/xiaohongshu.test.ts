import { describe, expect, test } from 'vitest';
import { parseHTML } from 'linkedom';
import { extractXiaohongshu } from './xiaohongshu';

function createDocument(html: string, url: string): Document {
	const { document } = parseHTML(html);
	Object.defineProperty(document, 'URL', {
		value: url,
		configurable: true,
	});
	return document as unknown as Document;
}

describe('extractXiaohongshu', () => {
	test('extracts note metadata, media, and template variables from initial state', () => {
		const document = createDocument(`
			<html>
				<head>
					<title>Fallback title - Xiaohongshu</title>
					<script>
						window.__INITIAL_STATE__={"note":{"noteDetailMap":{"testnote123":{"note":{
							"title":"State note title",
							"desc":"State note body\\n#state-topic[话题]# #second-topic",
							"type":"normal",
							"time":1736899200000,
							"user":{"nickname":"State Author"},
							"interactInfo":{"likedCount":"12","collectedCount":"34","commentCount":"5"},
							"imageList":[
								{"urlDefault":"https://media.example.invalid/image-a.jpg"},
								{"urlPre":"https://media.example.invalid/image-b.jpg"}
							],
							"tagList":[{"name":"fixture-tag"}]
						}}}}};
					</script>
				</head>
				<body></body>
			</html>
		`, 'https://www.xiaohongshu.com/explore/testnote123?xsec_token=TEST_TOKEN');

		const result = extractXiaohongshu(document);

		expect(result).not.toBeNull();
		expect(result?.title).toBe('State note title');
		expect(result?.author).toBe('State Author');
		expect(result?.contentText).toBe('State note body\n#state-topic# #second-topic');
		expect(result?.images).toEqual([
			'https://media.example.invalid/image-a.jpg',
			'https://media.example.invalid/image-b.jpg',
		]);
		expect(result?.tags).toEqual(['fixture-tag', 'state-topic', 'second-topic']);
		expect(result?.variables.xhsImageMarkdown).toContain('![State note title](https://media.example.invalid/image-a.jpg)');
		expect(result?.variables.xhsLikes).toBe('12');
	});

	test('extracts the visible center post from DOM when initial state is unavailable', () => {
		const document = createDocument(`
			<html>
				<head><title>Fixture page</title></head>
				<body>
					<section class="note-item">
						<div class="title">Background recommendation</div>
						<img src="https://media.example.invalid/background.jpg" />
					</section>
					<div class="note-detail-mask">
						<div class="note-container">
							<div class="media-container">
								<img src="https://media.example.invalid/visible-post.jpg" />
							</div>
							<div class="interaction-container">
								<div class="author-container"><span class="name">Post Author</span></div>
								<div class="note-content">
									<div id="detail-title">Visible post title</div>
									<div id="detail-desc" class="desc">Visible post body. #topic[话题]# #second-topic</div>
									<div class="date">Edited on 04-25</div>
								</div>
								<div class="interact-container">
									<div class="like-wrapper"><span class="count">417</span></div>
									<div class="collect-wrapper"><span class="count">317</span></div>
									<div class="chat-wrapper"><span class="count">36</span></div>
								</div>
							</div>
						</div>
					</div>
				</body>
			</html>
		`, 'https://www.xiaohongshu.com/explore/visiblepost123?xsec_token=TEST_TOKEN');

		const result = extractXiaohongshu(document);

		expect(result).not.toBeNull();
		expect(result?.noteId).toBe('visiblepost123');
		expect(result?.title).toBe('Visible post title');
		expect(result?.author).toBe('Post Author');
		expect(result?.images).toEqual(['https://media.example.invalid/visible-post.jpg']);
		expect(result?.contentHtml).not.toContain('Background recommendation');
		expect(result?.variables.xhsLikes).toBe('417');
		expect(result?.variables.xhsCollects).toBe('317');
		expect(result?.variables.xhsComments).toBe('36');
	});

	test('returns null outside Xiaohongshu', () => {
		const document = createDocument('<html></html>', 'https://example.com/');
		expect(extractXiaohongshu(document)).toBeNull();
	});
});
