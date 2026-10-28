# MakerWorld to Bambuddy

Chrome 扩展：在 MakerWorld 中国站或国际站模型页面选择打印配置，触发下载 3MF 并上传到自己配置的 Bambuddy 文件管理器根目录。使用浏览器现有的 MakerWorld 和 Bambuddy 登录会话，无需配置 API Key。

## 使用

1. 在 Chrome 的扩展管理页面加载本目录，或安装商店发布版。
2. 打开扩展，填入 Bambuddy 的地址（例如 `http://服务器:3215`），保存并授予该主机权限。
3. 在 Chrome 中打开并登录 Bambuddy；在另一个标签页登录 MakerWorld。
4. 打开模型详情页，在网站上选好打印配置，点击扩展图标，再点击“下载并导入当前配置”。
5. 导入完成后，在 Bambuddy 文件管理器查看。项目文件仍需针对打印机切片。

## 验证情况

中国站模型 1236582 的配置 1318410 已真实下载并上传到 Bambuddy 1.2.5.7。国际站适配已实现，但因 Cloudflare 验证尚未完成实际端到端测试。支持的 CDN 和页面按钮取决于 MakerWorld 的实现，网站改变、验证码或限制下载时可能需要更新。

## 安全与数据

扩展在用户发起导入时，从已登录的 Bambuddy 标签页读取会话令牌，仅用于向用户配置的地址上传文件；令牌不保存在扩展存储中。扩展临时观察发起导入的标签页的 MakerWorld 下载请求。若 Bambuddy 使用 HTTP，令牌与文件会明文传输；有条件时使用 HTTPS。不要删除已加载的扩展目录。浏览器可能还会保留下载副本。

## 开发

运行 `node --check background.js`、`node --check popup.js` 和 `node tests/transfer.cjs`。`store/` 包含待发布的说明和隐私政策草稿，不能替代公开托管的政策页面。扩展与 MakerWorld、Bambu Lab 和 Bambuddy 无官方关联。

详细的数据处理说明见 [PRIVACY.md](PRIVACY.md)。本项目是独立的社区工具，与 MakerWorld、Bambu Lab 和 Bambuddy 无官方关联。
