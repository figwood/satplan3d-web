# 卫星轨道可视化系统

这是一个基于 Next.js 的 Web 应用程序，使用 CesiumJS 实现卫星轨道的三维可视化。

## 环境配置

1. 安装依赖：
```bash
npm install
# 或者
yarn install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看运行效果

## 功能特性

- 卫星轨道的三维可视化展示
- 基于时间的动态可视化及动画控制
- 基于 React 的交互式用户界面

## 文件结构说明

- `pages/index.js` - 主页面
- `pages/_app.js` - 自定义 App 组件
- `pages/_document.js` - 自定义 Document 组件，用于 head 标签定制
- `components/SatelliteViewer.js` - Cesium 视图组件
- `utils/satellite.js` - 轨道计算的卫星类
- `styles/globals.css` - 全局样式
- `next.config.js` - Next.js 的 Cesium 配置

## 开发注意事项

1. 本项目使用 Next.js 框架，请确保熟悉 React 和 Next.js 的基本概念
2. 3D 可视化部分使用 CesiumJS，需要对 Cesium API 有基本了解
