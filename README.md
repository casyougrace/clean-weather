# 清朗天气 · GitHub Pages 静态版

苹果天气风格的无广告天气网站。网站代码由 GitHub Pages 静态托管，天气数据由浏览器直接请求 Open-Meteo，因此不需要服务器、数据库或 API Key。

## 功能

- 搜索并切换全球城市
- 热门城市与最近城市
- 浏览器定位
- 当前天气、24 小时预报、7 日预报
- 未来两小时 15 分钟降水
- 空气质量
- 每 10 分钟自动刷新
- 从后台重新切回页面时自动刷新
- 响应式设计与 PWA 配置

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 本地检查静态构建

```bash
npm run typecheck
npm run build
```

静态文件会生成在 `out` 文件夹。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy-pages.yml`，推送到 `main` 分支后会自动构建和部署。

1. 将本项目文件覆盖上传到 GitHub 仓库根目录。
2. 仓库为 GitHub Free 私有仓库时，请先改成 Public；或者使用支持私有仓库 Pages 的付费方案。
3. 打开仓库 `Settings → Pages`。
4. 在 `Build and deployment → Source` 中选择 `GitHub Actions`。
5. 打开 `Actions` 标签，等待 `Deploy GitHub Pages` 变为绿色。
6. 网站地址通常是：`https://用户名.github.io/仓库名/`。

`next.config.mjs` 会在 GitHub Actions 中自动读取仓库名并设置子路径，因此仓库不叫 `clean-weather` 也能部署。

## 数据更新方式

“静态”只表示网站文件由 GitHub Pages 托管。天气数据不是写死的：

- 打开页面时实时请求 Open-Meteo；
- 切换城市后立即重新请求；
- 页面打开期间每 10 分钟更新；
- 从后台切回页面时更新。

## 数据来源

- 天气：Open-Meteo
- 空气质量：Open-Meteo / CAMS

请保留页面底部的数据来源标注。
