# 清朗天气 · Open-Meteo 版

一个无广告、无资讯流、无需 API Key 的极简天气网站。视觉采用类似系统天气应用的沉浸式渐变、毛玻璃卡片和大字号信息层级，但不复制 Apple 的图标或素材。

## 已完成

- 当前天气与体感温度
- 浏览器定位
- 点击城市名直接打开城市选择器
- 中文城市联想搜索、热门城市快捷选择
- 自动保存最近选择的 8 个城市，并记住上次打开的城市
- 未来 24 小时预报
- 未来 7 日预报与温度区间
- 未来 2 小时降水趋势（15 分钟间隔）
- 空气质量（US AQI、PM2.5、PM10）
- 根据晴、云、雨、雪、雾和昼夜自动改变背景
- 手机、平板、电脑响应式布局
- PWA Manifest，可添加到手机桌面
- 服务端代理与缓存
- 无需注册、无需 API Key、无需数据库

## 数据来源

- 天气预报与城市地理搜索：Open-Meteo
- 空气质量：Open-Meteo Air Quality API，底层数据来自 CAMS

Open-Meteo 在中国等没有原生 15 分钟模型覆盖的区域，会将小时数据插值为 15 分钟数据。因此页面将其标注为“降水趋势”，不将其描述为雷达分钟级临近预报。

Open-Meteo 本身不提供中国官方灾害预警，所以此版本不展示天气预警。遇到台风、暴雨、强对流等高影响天气，应以中央气象台和当地气象部门发布的信息为准。

## 本地运行

需要 Node.js 22。

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

无需创建 `.env.local`，运行后直接获取真实天气。

## 修改默认城市

默认城市是合肥。需要修改时，复制 `.env.example` 为 `.env.local`：

```env
NEXT_PUBLIC_DEFAULT_LOCATION=117.23,31.82
NEXT_PUBLIC_DEFAULT_LOCATION_NAME=合肥
```

坐标格式为“经度,纬度”。修改后重启开发服务器。

## 部署到 EdgeOne Makers

1. 将项目上传到 GitHub 仓库。
2. 在 EdgeOne Makers 中导入 Git 仓库。
3. 框架选择 Next.js，Node.js 选择 22。
4. 直接部署，无需配置天气 API 环境变量。
5. 如需更换默认城市，再添加上面的两个可选环境变量。

## API 路由

网站通过自身服务端调用：

- `https://api.open-meteo.com/v1/forecast`
- `https://geocoding-api.open-meteo.com/v1/search`
- `https://air-quality-api.open-meteo.com/v1/air-quality`

浏览器只访问本站的 `/api/weather` 与 `/api/search`，便于统一缓存和错误处理。

## 使用边界

该项目默认按个人、学习和非商业用途设计。商业部署前，请自行核对 Open-Meteo 当时的授权条款与套餐要求。
