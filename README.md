# 期权学习与可视化平台 (Option Learning Platform)

这是一个基于 React + TypeScript + Vite 构建的期权定价与风险指标（Greeks）可视化学习工具。旨在帮助用户直观地理解 Black-Scholes 模型及其衍生指标。

## 功能特点

- **期权定价模型**: 完整实现了 Black-Scholes-Merton (BSM) 定价模型。
- **Greeks 可视化**:
  - **基础指标**: Delta, Gamma, Theta, Vega, Rho。
  - **高阶指标**: Vanna, Charm, Speed, Color, Volga (Vomma), Zomma。
  - 提供 2D 曲线图和 3D 曲面图，展示指标随标的价格、时间、波动率等因素的变化。
- **数学公式展示**: 提供完整的 BSM 定价公式及各希腊字母的数学定义（支持 Call/Put 区分）。
- **交互式仪表盘**: 用户可以动态调整参数（股价、行权价、波动率、利率、到期时间等），实时观察指标变化。

## 技术栈

- **前端框架**: React, TypeScript, Vite
- **UI 组件**: Tailwind CSS, Lucide React
- **图表库**: ECharts (用于 2D 和 3D 可视化)
- **数学公式**: KaTeX / React-Latex-Next

## 部署说明

### 环境要求

- Node.js (推荐 v16+)
- npm 或 yarn

### 本地开发

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd learn_option
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

   启动后，访问 `http://localhost:5173` (或终端显示的地址) 即可使用。

### 构建生产版本

如需部署到生产环境，请运行以下命令构建静态资源：

```bash
npm run build
```

构建产物将生成在 `dist` 目录下。

## 目录结构

- `src/utils`: 核心算法实现（Black-Scholes 公式、数据生成器）。
- `src/components`: UI 组件（图表、仪表盘、控制面板）。
- `src/types`: TypeScript 类型定义。
