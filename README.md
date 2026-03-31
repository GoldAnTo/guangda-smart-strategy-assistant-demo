# 光大资管智能策略推荐助手

光大资管内部使用的智能策略推荐与展示系统，为理财顾问提供策略筛选、对比分析、AI 推荐解读等全链路工具。

---

## 项目背景

光大资管策略顾问台定位为**理财师的专业辅助工具**，而非普通客户界面。核心目标是：

1. **策略研究与筛选** — 在海量产品中快速找到符合客户需求的策略
2. **客户画像匹配** — 根据客户风险偏好、投资期限、资金规模智能推荐
3. **策略对比展示** — 多维度横向对比，帮助顾问理解策略差异
4. **大屏展览展示** — 会议室/路演场景下的大屏策略展示模式

---

## 技术架构

```
┌─────────────────────────────────────────────┐
│                前端 Vue 3 + Vite             │
│         策略首页 / 顾问台 / 对比 / 展览 / 配置  │
└──────────────┬──────────────────────────────┘
               │ HTTP API
┌──────────────▼──────────────────────────────┐
│              后端 Node.js + Express           │
│   /api/strategies  /api/recommend            │
│   /api/match  /api/portfolio                │
│   /api/analyze  /api/explain               │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴──────────┐
     ▼                    ▼
  数据层                   AI 推理层
recommendation-rules.json  rule-engine（纯规则，无外部 AI API）
strategies-enhanced.json   demand-service（客户画像 → 需求）
strategies-timeseries.json  recommend-service（规则引擎推荐）
```

---

## 目录结构

```
guangda-smart-strategy-assistant-demo/
├── server/                     # 后端 Node.js + Express
│   └── src/
│       ├── app.ts              # Express 入口
│       ├── routes/             # 路由层（8个）
│       │   ├── strategies.ts   # 策略列表 / 详情 / 时序
│       │   ├── recommend.ts    # AI 策略推荐（Narrative 生成）
│       │   ├── match.ts        # 客户画像匹配
│       │   ├── portfolio.ts    # 组合配置
│       │   ├── analyze.ts      # 策略分析
│       │   ├── explain.ts      # 策略解读
│       │   ├── products.ts     # 产品目录
│       │   └── chat.ts         # 顾问对话
│       ├── services/           # 业务逻辑层（7个）
│       │   ├── recommend-service.ts  # 核心推荐规则引擎
│       │   ├── demand-service.ts     # 客户需求分析
│       │   ├── match-service.ts       # 匹配服务
│       │   ├── rule-service.ts        # 规则服务
│       │   ├── explanation-service.ts # 解读服务
│       │   ├── product-service.ts     # 产品服务
│       │   └── ai-service.ts          # AI 能力抽象
│       ├── prompts/             # Prompt 构建器
│       │   └── builders.ts
│       ├── data/                # 数据文件
│       │   ├── strategies-enhanced.json  # 策略主数据（20条）
│       │   ├── strategies-timeseries.json # 策略时序净值
│       │   ├── recommendation-rules.json # 推荐规则配置
│       │   ├── rules.json              # 通用规则
│       │   ├── match-rules.ts          # 匹配规则
│       │   ├── scenarios.json           # 场景配置
│       │   └── products.json           # 产品目录
│       └── utils/
│           └── response.ts       # 统一响应格式
│
├── frontend/                    # 前端 Vue 3 + Vite + TypeScript
│   └── src/
│       ├── views/               # 页面（6个）
│       │   ├── HomeView.vue          # 策略首页
│       │   ├── AdvisorView.vue        # 顾问工作台
│       │   ├── CompareView.vue        # 方向对比
│       │   ├── ExhibitionView.vue     # 展览模式（全屏大屏）
│       │   ├── RecommendationView.vue # 组合配置
│       │   └── ProductDetailView.vue  # 策略详情
│       ├── components/          # 通用组件
│       │   ├── DemandForm.vue        # 客户需求表单
│       │   └── RecommendationCard.vue # 推荐卡片
│       ├── services/
│       │   └── strategy.ts      # API 调用封装
│       ├── router/
│       │   └── index.ts         # 路由配置
│       └── main.ts
│
├── server-java/                 # Java-only 策略展示后端（备选）
└── _import_strategy_show/      # 原始数据导入
```

---

## 功能页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 策略首页 | `/` | 分类概览 + 策略搜索 + 排序筛选 |
| 顾问工作台 | `/advisor` | 客户画像 → AI 推荐策略 + 全程可解释 |
| 方向对比 | `/compare` | 多策略横向指标对比 |
| 展览模式 | `/exhibition` | 全屏大屏展示，数字优先，适合会议室 |
| 组合配置 | `/recommendation` | 客户需求 → 策略组合配置 |

---

## 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

---

## 快速启动

### 1. 安装后端依赖

```bash
cd E:\code\guangda-smart-strategy-assistant-demo\server
npm install
```

### 2. 安装前端依赖

```bash
cd E:\code\guangda-smart-strategy-assistant-demo\frontend
npm install
```

### 3. 启动后端

```bash
# 开发监听模式（文件变化自动重启）
cd E:\code\guangda-smart-strategy-assistant-demo\server
npm run dev

# 或稳定单次启动（推荐首次联调使用）
cd E:\code\guangda-smart-strategy-assistant-demo\server
npm run dev:once
```

后端启动后访问：`http://localhost:3003/health`

### 4. 启动前端

```bash
cd E:\code\guangda-smart-strategy-assistant-demo\frontend
npm run dev
```

前端启动后访问：`http://127.0.0.1:3001`

---

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Vite Dev | `3001` | 主开发服务器 |
| 后端 Node.js | `3003` | API 服务 |
| Java 后端（备选） | `3002` | Java-only 策略展示 |

---

## API 路由一览

### 策略
- `GET /api/strategies` — 策略列表
- `GET /api/strategies/:seed` — 策略详情
- `GET /api/strategies/:seed/timeseries` — 策略时序净值

### 推荐
- `POST /api/recommend` — 根据客户画像推荐策略
- `POST /api/recommend-narrative` — 生成 AI 对比分析 Narrative
- `POST /api/match` — 客户画像与策略匹配

### 组合
- `POST /api/portfolio/build` — 构建策略组合
- `GET /api/portfolio/optimize` — 组合优化建议

### 其他
- `GET /api/products` — 产品目录
- `GET /api/scenarios` — 配置场景
- `POST /api/analyze` — 策略分析
- `POST /api/explain` — 策略解读
- `POST /api/chat` — 顾问对话

---

## 数据说明

### 策略数据
- 主数据源：`server/src/data/strategies-enhanced.json`（20条，来自 `strategy_show.zip`）
- 时序净值：`server/src/data/strategies-timeseries.json`
- 字段说明：`navCategory`（分类）、`annualReturn`（年化收益）、`winRate`（胜率）、`maxDrawdown`（最大回撤）、`sharpe`（夏普比率）、`riskLevel`（风险等级）、`benchmarkName`（比较基准）

### 推荐规则
- 规则配置：`server/src/data/recommendation-rules.json`
- 规则引擎：纯规则匹配，无需外部 AI API Key

---

## 配置说明

### 前端环境变量
在 `frontend/.env` 中配置：

```env
VITE_API_BASE_URL=http://localhost:3003
```

### 后端端口
修改 `server/src/app.ts` 中的端口：

```ts
const PORT = 3003
```

---

## 开发规范

- **前端**：Vue 3 Composition API + TypeScript，样式使用 scoped CSS
- **后端**：Node.js + Express + TypeScript，使用 `tsx` 运行时
- **API 响应格式**：统一使用 `utils/response.ts` 的 `ok()` / `err()` 封装
- **规则引擎**：所有 AI 相关功能使用规则引擎替代，无需 API Key

---

## 已知限制

- 推荐功能使用纯规则引擎，适合 Demo 展示；生产环境可替换为真实 AI API
- 时序数据为模拟数据，用于图表展示
- Exhibition 展览模式为全屏 fixed 布局，独立于全局顶部导航

---

## 相关文档

- `RUN-DEMO.md` — 详细启动与调试指南
- `docs/scoring-model-structure.md` — 评分模型结构说明
- `docs/strategy-benchmark-module.md` — 基准模块说明
- `docs/recommendation-page-upgrade.md` — 推荐页面升级记录
