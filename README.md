> **【中文说明】**  
> 本仓库是 [Obsidian 官方网页剪藏（obsidian-clipper）](https://github.com/obsidianmd/obsidian-clipper) 的 **fork**，在官方功能之外 **仅增加**：在哔哩哔哩（Bilibili）视频页剪藏时，通过扩展从 B 站接口拉取 **字幕/口播文稿**，并写入剪藏笔记中的 **「字幕」** 区块（模板变量 `{{transcript}}`）。请在 Obsidian Web Clipper 设置中 **导入模板**：[哔哩哔哩视频字幕剪藏模板.json](./哔哩哔哩视频字幕剪藏模板.json)（仓库根目录；在 GitHub 网页上可点开链接后使用右上角 **Raw** 下载再导入）。其余行为与上游一致；使用与排错请以官方文档为准。

## 本地构建并加载扩展（中文）

以下步骤在 **Windows、macOS、Linux** 上相同；只需在本机安装 [Node.js](https://nodejs.org/)（建议 LTS），并在**仓库根目录**打开终端执行命令即可。各系统打开终端的方式示例：**Windows**（PowerShell 或「终端」）、**macOS**（「终端」或 iTerm）、**Linux**（发行版自带终端）。

1. `npm install` — 安装依赖。  
2. `npm run build:chrome` — 生成 Chromium 系浏览器共用的 **`dist/`** 目录（内含 `manifest.json` 等）。若需一并构建 Firefox / Safari，可用 `npm run build`（会额外得到 `dist_firefox/`、`dist_safari/`）。  
3. 修改源码后重新执行第 2 步，再在浏览器扩展页对该扩展点 **「重新加载」**。

### 重点：Google Chrome（Windows 与 macOS）

1. 地址栏打开 **`chrome://extensions`**。  
2. 打开右上角 **「开发者模式」**。  
3. 点击 **「加载已解压的扩展程序」**，选中本仓库的 **`dist`** 文件夹（**不要**选 `builds` 里的 zip）。  
   - **Windows** 路径示例：`C:\Users\你的用户名\…\obsidian-clipper\dist`  
   - **macOS** 路径示例：`/Users/你的用户名/…/obsidian-clipper/dist`  
4. 以后每次重新构建后，在同一页面点击该扩展的 **「重新加载」**。

### Linux 上的 Google Chrome

与上相同：使用 **`chrome://extensions`** + **`dist/`**；路径形如 `/home/你的用户名/…/obsidian-clipper/dist`。

### 其他 Chromium 系浏览器（Edge、Brave、Arc、Opera 等）

同样加载 **`dist/`** 未打包目录；仅「扩展管理」入口不同，例如 Microsoft Edge 为 **`edge://extensions`**，Brave 多为 **`brave://extensions`**，界面与 Chrome 类似（开发者模式 + 加载已解压）。

### Firefox

执行 **`npm run build:firefox`**，在 `about:debugging#/runtime/this-firefox` 中 **「临时载入扩展」**，选择 **`dist_firefox/manifest.json`**。长期安装方式见下文英文 **Developers** 小节。

### Safari（macOS / iOS）

执行 **`npm run build:safari`** 后需配合 Xcode 工程安装，步骤见下文英文 **Developers** 中 *iOS Simulator* 相关说明。

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
