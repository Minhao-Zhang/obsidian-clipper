> **【中文说明】**  
> 本仓库是 [Obsidian 官方网页剪藏（obsidian-clipper）](https://github.com/obsidianmd/obsidian-clipper) 的个人 fork，用于保留一些适合个人工作流的改动。与官方版的具体差异请以本仓库代码和提交记录为准。  
> 如果你只需要官方稳定版，请优先使用 [官方安装页](https://obsidian.md/clipper)、[Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf) 或 [官方 GitHub 仓库](https://github.com/obsidianmd/obsidian-clipper)。  
> 本 fork 包含额外站点支持和示例模板，例如 [哔哩哔哩视频字幕剪藏模板.json](./哔哩哔哩视频字幕剪藏模板.json)、[小红书笔记剪藏模板.json](./小红书笔记剪藏模板.json) 与 [Outlook邮件剪藏模板.json](./Outlook邮件剪藏模板.json)。导入模板时，可在 GitHub 打开对应文件后点击 **Raw** 下载再导入。

## 下载与安装

1. 打开本仓库 **[Releases](https://github.com/Minhao-Zhang/obsidian-clipper/releases)**，在最新版本 **Assets** 中下载与你浏览器对应的 zip：  
   - **Chrome / Edge / Brave 等 Chromium 系**：`obsidian-web-clipper-fork-chrome.zip`  
   - **Firefox**：`obsidian-web-clipper-fork-firefox.zip`  
   - **Safari**：`obsidian-web-clipper-fork-safari.zip`  
2. **Chromium 系**：将 zip **解压**到任意文件夹 → 地址栏打开 `chrome://extensions`（Edge 一般为 `edge://extensions`，Brave 多为 `brave://extensions`）→ 打开右上角 **「开发者模式」** → **「加载已解压的扩展程序」** → 选中解压后的**文件夹**（勿直接把 zip 当文件夹加载）。  
3. **Firefox**：解压后打开 `about:debugging#/runtime/this-firefox` → **「临时载入附加组件」** → 选中解压目录里的 **`manifest.json`**。  
4. **Safari**：解压后请按 Apple 与 Obsidian 对 Safari 网页扩展的常见方式安装；更稳妥可使用 [官方商店版](https://obsidian.md/clipper)。  

侧载**未经**浏览器商店审核，请自担风险；需要官方支持与商店安装请使用 **[obsidian.md/clipper](https://obsidian.md/clipper)**。

## 本地开发

若要在本机克隆仓库、改代码、`npm run build` 与各浏览器 `dist` 目录等，请阅读 **[Developers（英文）](https://github.com/Minhao-Zhang/obsidian-clipper/blob/main/README.md#developers)** 一节（可与同页 **Get started** 中的官方商店链接对照）；中文部分不再重复构建步骤。

---

Obsidian Web Clipper helps you highlight and capture the web in your favorite browser. Anything you save is stored as durable Markdown files that you can read offline, and preserve for the long term.

- **[Download Web Clipper](https://obsidian.md/clipper)**
- **[Documentation](https://help.obsidian.md/web-clipper)**
- **[Troubleshooting](https://help.obsidian.md/web-clipper/troubleshoot)**

## Get started

Install the extension by downloading it from the official directory for your browser:

- **[Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf)** for Chrome, Brave, Arc, Orion, and other Chromium-based browsers.
- **[Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/web-clipper-obsidian/)** for Firefox and Firefox Mobile.
- **[Safari Extensions](https://apps.apple.com/us/app/obsidian-web-clipper/id6720708363)** for macOS, iOS, and iPadOS.
- **[Edge Add-Ons](https://microsoftedge.microsoft.com/addons/detail/obsidian-web-clipper/eigdjhmgnaaeaonimdklocfekkaanfme)** for Microsoft Edge.

## Use the extension

Documentation is available on the [Obsidian Help site](https://help.obsidian.md/web-clipper), which covers how to use [highlighting](https://help.obsidian.md/web-clipper/highlight), [templates](https://help.obsidian.md/web-clipper/templates), [variables](https://help.obsidian.md/web-clipper/variables), [filters](https://help.obsidian.md/web-clipper/filters), and more.

## Contribute

### Translations

You can help translate Web Clipper into your language. Submit your translation via pull request using the format found in the [/_locales](/src/_locales) folder.

### Features and bug fixes

See the [help wanted](https://github.com/obsidianmd/obsidian-clipper/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tag for issues where contributions are welcome.

## Roadmap

In no particular order:

- [ ] A separate icon for Web Clipper
- [ ] Annotate highlights
- [ ] Template directory
- [x] Template validation
- [x] Template logic (if/for)
- [x] Save images locally, [added in Obsidian 1.8.0](https://obsidian.md/changelog/2024-12-18-desktop-v1.8.0/)
- [x] Translate UI into more languages — help is welcomed

## Developers

To build the extension:

```
npm run build
```

This will create three directories:
- `dist/` for the Chromium version
- `dist_firefox/` for the Firefox version
- `dist_safari/` for the Safari version

### Install the extension locally

For Chromium browsers, such as Chrome, Brave, Edge, and Arc:

1. Open your browser and navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist` directory

For Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the `dist_firefox` directory and select the `manifest.json` file

If you want to run the extension permanently you can do so with the Nightly or Developer versions of Firefox.

1. Type `about:config` in the URL bar
2. In the Search box type `xpinstall.signatures.required`
3. Double-click the preference, or right-click and select "Toggle", to set it to `false`.
4. Go to `about:addons` > gear icon > **Install Add-on From File…**

For iOS Simulator testing on macOS:

1. Run `npm run build` to build the extension
2. Open `xcode/Obsidian Web Clipper/Obsidian Web Clipper.xcodeproj` in Xcode
3. Select the **Obsidian Web Clipper (iOS)** scheme from the scheme selector
4. Choose an iOS Simulator device and click **Run** to build and launch the app
5. Once the app is running on the simulator, open **Safari**
6. Navigate to a webpage and tap the **Extensions** button in Safari to access the Web Clipper extension

### Run tests

```
npm test
```

Or run in watch mode during development:

```
npm run test:watch
```

## Third-party libraries

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) for browser compatibility
- [defuddle](https://github.com/kepano/defuddle) for content extraction and Markdown conversion
- [dayjs](https://github.com/iamkun/dayjs) for date parsing and formatting
- [lz-string](https://github.com/pieroxy/lz-string) to compress templates to reduce storage space
- [lucide](https://github.com/lucide-icons/lucide) for icons
- [dompurify](https://github.com/cure53/DOMPurify) for sanitizing HTML
