# MyCloudAI Value Investment Tools

[中文说明](README.md)

MyCloudAI Value Investment Tools is a local-first value investing workbench with an API surface that can be consumed directly by AI agents. It is built with React, Vite, TypeScript, Tailwind, Recharts, Zustand, Playwright, and Cloudflare Workers.

Domain:

[https://value-investment-tools.mycloudai.org](https://value-investment-tools.mycloudai.org)

The product combines valuation, financial health, growth quality, risk control, research workflows, a journal, and a portfolio tracker in one place, while also exposing discovery endpoints, tool schemas, and compute endpoints for programmatic use.

## Screenshots

| Dashboard | Valuation Category |
| --- | --- |
| ![Dashboard overview](docs/screenshots/dashboard-overview.png) | ![Valuation category](docs/screenshots/valuation-category.png) |
| Two-stage DCF results | FMP research bundle |
| ![Two-stage DCF results](docs/screenshots/dcf-results.png) | ![FMP research bundle](docs/screenshots/data-research-bundle.png) |

## Highlights

- A full tool set across valuation, financial health, growth quality, risk management, workflow, and education.
- A data center that fetches an FMP research bundle and maps it straight into DCF, F-Score, Z-Score, Owner Earnings, and related tools.
- Journal and portfolio trackers for thesis capture, position follow-up, and margin-of-safety review.
- AI-readable APIs so agents can discover tools, read tool summaries, fetch schemas, and submit YAML or JSON to get structured results.
- Playwright coverage for formula sanity, API discovery, FMP autofill flows, and core user workflows.

## AI / API Surface

Discovery endpoints:

- `GET /api/ai/manifest.json`
- `GET /api/ai/tools.yaml`
- `GET /openapi.json`
- `GET /sitemap.xml`
- `GET /robots.txt`

Per-tool endpoints:

- `GET /api/tools/{category}/{slug}/schema.yaml`
- `GET /api/tools/{category}/{slug}/schema.json`
- `POST /api/tools/{category}/{slug}/compute.yaml`
- `POST /api/tools/{category}/{slug}/compute.json`

Recommended agent workflow:

1. Read `/api/ai/tools.yaml` to discover available tools and short descriptions.
2. Read a target schema such as `/api/tools/valuation/dcf-two-stage/schema.yaml`.
3. Populate the `inputs` structure with facts.
4. Send YAML or JSON to the relevant compute endpoint.
5. Consume `summary`, `details`, `charts`, and `narrative` from the response.

Example: read the Kelly schema

```bash
curl https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/schema.yaml
```

Example: compute from YAML

```bash
curl -X POST \
  https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/compute.yaml \
  -H "Content-Type: application/yaml" \
  --data-binary $'inputs:\n  winRate: 60\n  payoffRatio: 2\n'
```

## FMP Research Bundle

FMP is not treated as a raw JSON dump in this project.

The data center combines these endpoints:

- Quote
- Cash Flow Statement
- Balance Sheet Statement
- Income Statement
- Ratios
- Key Metrics

It then derives ready-to-apply inputs for tools such as:

- Two-stage DCF
- Reverse DCF
- Owner Earnings
- Piotroski F-Score
- Altman Z-Score
- FCF Quality

That lets a user fetch one ticker, review the derived highlights, and push the data into the right calculator without manually retyping line items.

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

Run the full local Cloudflare environment:

```bash
npm run dev:cf
```

Run the Worker-backed local server on the Playwright port:

```bash
npm run dev:cf:test
```

## Build and Deploy

Production build:

```bash
npm run build
```

Deploy:

```bash
npm run deploy
```

Build artifacts are written to `.output/dist`, and the Worker serves both the static app and API routes.

## Testing

Install the Playwright browser once:

```bash
npx playwright install --with-deps chromium
```

Run the full regression suite:

```bash
npm run test:e2e
```

Open the HTML report:

```bash
npm run test:e2e:report
```

Regenerate README screenshots:

```bash
npm run docs:screenshots
```

Coverage includes:

- formula sanity checks
- manifest and schema discovery endpoints
- YAML compute endpoint responses
- FMP research bundle autofill workflows
- journal, portfolio, and snapshot flows

## Repository Layout

```text
src/                      application source
src/worker.ts             Cloudflare Worker entrypoint
src/lib/toolkit.ts        tool registry and formulas
src/lib/ai-native.ts      schema and AI helper utilities
src/lib/fmp.ts            FMP research bundle mapping
tests/                    Playwright end-to-end and sanity tests
docs/screenshots/         README screenshots
skills/                   AI / agent usage instructions
.github/workflows/        CI workflow definitions
```

## Skill for Agents

The repository includes a reusable skill here:

- `skills/value-investment-tools/SKILL.md`

It explains how an AI assistant should discover tools, fetch schemas, send compute requests, and interpret returned results.

## CI

`.github/workflows/playwright.yml` runs on every push to `main` and will:

1. install dependencies
2. build the application
3. install Playwright browsers
4. run the full Playwright suite
5. upload HTML and raw test artifacts
