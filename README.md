# MakerWorld to Bambuddy

将 MakerWorld 中国站或国际站当前选中的打印配置，一键导入自己的 Bambuddy 文件库。模型需切片后才能打印。

## 工作原理

使用浏览器中已登录的 MakerWorld 会话获取 3MF，再使用已登录的 Bambuddy 会话上传到文件库根目录。无需配置 API Key，也不会自动开始打印。两个站点均已实际测试；国际站由用户手动验证。

## 安装和使用

1. 从 [Releases](https://github.com/ppx123-web/makerworld-bambuddy-import/releases) 下载 ZIP 并解压到固定位置。
2. 在 Chrome 打开 `chrome://extensions`，开启“开发者模式”，点击“加载已解压的扩展程序”，选择解压后的目录。
3. 点击扩展图标，输入并保存 Bambuddy 地址，按提示授权；在 Chrome 中登录 Bambuddy 和 MakerWorld，并保留 Bambuddy 标签页。
4. 在 MakerWorld 模型页选好打印配置，点击扩展图标，再点击“下载并导入当前配置”。完成后在 Bambuddy 文件管理器查看。

扩展读取 Bambuddy 会话令牌以完成上传，不将令牌保存到扩展存储。使用 HTTP 地址时，令牌和文件会明文传输；优先使用 HTTPS。更多信息见 [PRIVACY.md](PRIVACY.md)。

网站验证、登录或下载限制可能影响导入。本项目是独立社区工具，与 MakerWorld、Bambu Lab 和 Bambuddy 无官方关联。
