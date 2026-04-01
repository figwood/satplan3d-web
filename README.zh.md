# 卫星轨道可视化系统

这是一个基于 Next.js 的 Web 应用，使用 CesiumJS 实现卫星轨道三维可视化。除了可视化主界面外，项目还包含认证、后台管理页，以及用于卫星、传感器、轨迹、路径点和规划数据的 API 转发路由。

## 环境配置

1. 安装依赖：
```bash
npm install
# 或者
yarn install
```

2. 在 `.env.local` 中配置环境变量：
```bash
NEXTAUTH_SECRET=your-secret
API_URL=http://localhost:8000
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 功能特性

- 基于 CesiumJS 的卫星轨道三维可视化
- 基于时间的轨迹展示、路径渲染与动画控制
- 以树形结构选择卫星和传感器
- 在可视化界面中执行基于区域的任务规划
- 管理员登录与卫星管理页面
- 用于认证及后端接口转发的 Next.js API 路由

## 项目结构

- `pages/index.js` - 可视化主页面
- `components/SatelliteViewer.js` - Cesium 视图顶层容器
- `components/satellite/SatelliteVisualizer.js` - 卫星可视化核心逻辑
- `components/satellite/SatelliteTree.js` - 卫星与传感器树组件
- `components/satellite/SatelliteControls.js` - 视图交互控制组件
- `pages/login.js` - 管理员登录页
- `pages/admin/index.js` - 后台管理入口页
- `components/admin/SatelliteManager.js` - 卫星管理界面
- `pages/api/` - 认证、卫星、传感器、订单、规划、TLE、路径点与轨迹点等 Next.js API 路由
- `utils/satellite/apiService.js` - 前端 API 请求封装
- `utils/satellite/cesiumUtils.js` - Cesium 视图初始化工具
- `utils/satellite/orbitUtils.js` - 轨道相关工具函数
- `styles/globals.css` - 全局样式
- `styles/SatelliteViewer.module.css` - 查看器专用样式
- `next.config.js` - Next.js 与 Cesium 的构建配置

## 开发说明

1. 项目当前使用 Next.js 14、React 18 和 CesiumJS。
2. `API_URL` 必须指向提供登录、卫星、传感器、订单和规划接口的后端服务。
3. `/admin` 依赖基于 NextAuth Credentials 的认证，并要求正确配置 `NEXTAUTH_SECRET`。
4. Cesium 静态资源通过 `public/cesium/` 目录提供，部署时需要确保这些文件可用。
