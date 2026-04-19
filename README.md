> **【中文说明】**  
> 本仓库 fork 自 [Obsidian 官方网页剪藏（obsidian-clipper）](https://github.com/obsidianmd/obsidian-clipper)。在官方版基础上**只多了一项**：在哔哩哔哩视频页剪藏时，扩展会从 B 站接口取回**字幕/口播稿**，写进剪藏笔记里的「**字幕**」区块（模板里用 `{{transcript}}`）。  
> 使用前请到 Obsidian Web Clipper 设置里**导入这份模板**：[哔哩哔哩视频字幕剪藏模板.json](./哔哩哔哩视频字幕剪藏模板.json)（文件在仓库根目录；若在 GitHub 网页上打开，可先点进文件，再点右上角 **Raw** 下载后导入）。  
> 其他用法与官方仓库一致；具体怎么用、出问题怎么查，请以官方文档为准。

## 本地构建并安装扩展

在仓库根目录：

1. `npm install`  
2. `npm run build:chrome` → **`dist/`**（Chromium 系）。要 Firefox / Safari 用 `npm run build`，或 `npm run build:firefox` / `npm run build:safari`。  
3. 改代码后重新构建，在扩展管理页对本扩展 **重新加载**。

### Chromium（Chrome、Edge、Brave 等）

在扩展页（如 `chrome://extensions`、`edge://extensions`、`brave://extensions`）打开开发者模式，**加载已解压**，选本仓库的 **`dist`**（勿选 `builds` 里的 zip）。

### Firefox

`npm run build:firefox` 后，在 `about:debugging#/runtime/this-firefox` **临时载入** `dist_firefox/manifest.json`。长期安装见下文 **Developers**。

### Safari

`npm run build:safari` 后需用 Xcode；见下文 **Developers** 中 *iOS Simulator* 相关说明。

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
