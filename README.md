# MyCloudAI 价值投资工具

[English README](README.en.md)

MyCloudAI 价值投资工具是一个本地优先、同时可被 AI 直接调用的价值投资工作台。项目基于 React、Vite、TypeScript、Tailwind、Recharts、Zustand、Playwright 和 Cloudflare Workers 构建。

域名：

[https://value-investment-tools.mycloudai.org](https://value-investment-tools.mycloudai.org)

它把估值、财务健康、成长质量、风险控制、投资日志、持仓追踪和数据研究放进同一个站点，同时提供 AI 发现接口、schema 接口和计算接口，便于程序化接入。

## 功能截图

| 首页总览 | 估值分类页 |
| --- | --- |
| ![首页总览](docs/screenshots/dashboard-overview.png) | ![估值分类页](docs/screenshots/valuation-category.png) |
| 两阶段 DCF 结果区 | FMP 研究包 |
| ![两阶段 DCF](docs/screenshots/dcf-results.png) | ![FMP 研究包](docs/screenshots/data-research-bundle.png) |

## 核心能力

- 覆盖估值、财务健康、成长质量、风险管理、投资记录和教育辅助的完整工具集。
- 数据中心可以抓取 FMP 研究包，并直接预填到 DCF、F-Score、Z-Score、Owner Earnings 等工具。
- Journal 与 Portfolio 帮助你记录论点、跟踪持仓、复盘安全边际与盈亏变化。
- AI 可以通过 API 发现全部工具、读取工具简述和 schema，并发送 YAML 或 JSON 获取结构化结果。
- Playwright 回归覆盖公式 sanity、API 发现、FMP 预填和核心工作流。

## AI / API 接口

发现接口：

- `GET /api/ai/manifest.json`
- `GET /api/ai/tools.yaml`
- `GET /openapi.json`
- `GET /sitemap.xml`
- `GET /robots.txt`

单工具接口：

- `GET /api/tools/{category}/{slug}/schema.yaml`
- `GET /api/tools/{category}/{slug}/schema.json`
- `POST /api/tools/{category}/{slug}/compute.yaml`
- `POST /api/tools/{category}/{slug}/compute.json`

推荐的 AI 调用流程：

1. 先读取 `/api/ai/tools.yaml`，确认可用工具和工具简述。
2. 再读取目标工具的 schema，例如 `/api/tools/valuation/dcf-two-stage/schema.yaml`。
3. 按 `inputs` 结构填入事实数据。
4. 把 YAML 或 JSON 发送到 `compute.yaml` 或 `compute.json`。
5. 读取返回中的 `summary`、`details`、`charts` 和 `narrative`。

示例：读取 Kelly schema

```bash
curl https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/schema.yaml
```

示例：发送 YAML 计算

```bash
curl -X POST \
  https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/compute.yaml \
  -H "Content-Type: application/yaml" \
  --data-binary $'inputs:\n  winRate: 60\n  payoffRatio: 2\n'
```

## FMP 研究包

FMP 在这个项目里不只是原始 JSON 缓存，而是研究数据入口。

数据中心会组合以下端点：

- Quote
- Cash Flow Statement
- Balance Sheet Statement
- Income Statement
- Ratios
- Key Metrics

然后自动映射出适合现有工具的输入参数，帮助你把一个 ticker 的基础面数据快速落到：

- 两阶段 DCF
- 反向 DCF
- Owner Earnings
- Piotroski F-Score
- Altman Z-Score
- FCF 质量分析器

## 本地运行

安装依赖：

```bash
npm install
```

仅启动前端：

```bash
npm run dev
```

启动完整本地 Cloudflare 环境：

```bash
npm run dev:cf
```

在 Playwright 默认端口启动本地 Worker 服务：

```bash
npm run dev:cf:test
```

## 构建与部署

生产构建：

```bash
npm run build
```

部署：

```bash
npm run deploy
```

构建产物输出到 `.output/dist`，Worker 同时负责静态资源与 API 路由。

## 测试

首次安装 Playwright 浏览器：

```bash
npx playwright install --with-deps chromium
```

运行完整回归：

```bash
npm run test:e2e
```

查看 HTML 报告：

```bash
npm run test:e2e:report
```

重新生成 README 截图：

```bash
npm run docs:screenshots
```

当前覆盖包括：

- 公式结果 sanity 校验
- AI manifest 与 schema 发现接口
- YAML 计算接口返回结果
- FMP 研究包预填工作流
- Journal、Portfolio、快照导入导出流程

## 目录结构

```text
src/                      应用源码
src/worker.ts             Cloudflare Worker 入口
src/lib/toolkit.ts        工具注册表与公式实现
src/lib/ai-native.ts      schema 与 AI 调用辅助逻辑
src/lib/fmp.ts            FMP 研究包映射逻辑
tests/                    Playwright 回归与 sanity 测试
docs/screenshots/         README 功能截图
skills/                   AI / agent 使用说明
.github/workflows/        CI 工作流
```

## 面向 AI 的 Skill

仓库里已经加入可复用 skill：

- `skills/value-investment-tools/SKILL.md`

它会告诉 AI 如何发现工具、读取 schema、发送请求并解释返回结果。

## CI

`.github/workflows/playwright.yml` 会在 `main` 每次 push 后自动：

1. 安装依赖
2. 构建站点
3. 安装 Playwright 浏览器
4. 运行完整 Playwright 回归
5. 上传 HTML 报告和原始测试结果
