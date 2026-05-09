---
name: value-investment-tools
description: Discover the current MyCloudAI Value Investment Tools catalog from tools.yaml, then fetch the selected tool schema and call its compute endpoint.
base_url: https://value-investment-tools.mycloudai.org
permissions:
  - network: fetch tool schemas and compute endpoints
capabilities:
  - discover_tool_catalog
  - fetch_tool_schema
  - execute_valuation_models
  - compute_position_sizing
  - screen_financial_health
supported_tools:
  - valuation/dcf-two-stage
  - valuation/dcf-reverse
  - risk/margin-of-safety
  - health/f-score
  - health/z-score
  - risk/kelly
triggers:
  - keywords:
      - valuation
      - DCF
      - fair value
      - intrinsic value
      - Kelly
      - position size
      - margin of safety
      - F score
      - Z score
      - bankruptcy risk
      - terminal growth
    question_patterns:
      - "What is the fair value of (ticker|company)?"
      - "How much should I allocate to (trade|stock)?"
      - "Is (company) financially healthy?"
      - "What growth is the market pricing for (company)?"
      - "Compute margin of safety for (ticker)"
output_formats:
  - summary
  - details
  - charts
  - narrative
---

# Value Investment Tools Skill

## Goal

Use MyCloudAI Value Investment Tools as a discovery-first API surface.

Do not assume you already know which tools exist or which fields a tool accepts.
Always discover the current catalog first, then fetch the selected schema, then call the compute endpoint.

Domain:

https://value-investment-tools.mycloudai.org

## Source Of Truth

- Treat `GET /api/ai/tools.yaml` as the current tool inventory.
- Treat `GET /api/tools/{category}/{slug}/schema.yaml` as the current input contract for one tool.
- Treat the echoed `inputs` and returned `warnings` in compute responses as the post-normalization truth.
- Do not treat the frontmatter `supported_tools` list in this file as exhaustive.

## Primary Workflow

1. Read `GET /api/ai/tools.yaml`.
2. Choose the narrowest tool that directly answers the user question.
3. Read `GET /api/tools/{category}/{slug}/schema.yaml` before constructing input.
4. Build a payload with a top-level `inputs` object.
5. Send YAML to `POST /api/tools/{category}/{slug}/compute.yaml` or JSON to `compute.json`.
6. Inspect `warnings` and echoed `inputs` before trusting the result.
7. Use `summary`, `details`, `charts`, and `narrative` to answer the user.

## Tool Selection

- Use `purpose`, `scenario`, `category`, `priority`, and `route` from `tools.yaml` to choose a tool.
- Prefer one specific tool over a broad tool when the user asks a narrow question.
- Use valuation tools for fair-value, implied-growth, and scenario questions.
- Use health tools for accounting quality, distress risk, and capital allocation questions.
- Use risk tools for sizing, sensitivity, and margin-of-safety questions.
- If multiple tools are plausible, choose the one whose `purpose` most directly matches the user request.

## Endpoint Order

Primary discovery endpoints:

- `GET https://value-investment-tools.mycloudai.org/api/ai/tools.yaml`
- `GET https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/schema.yaml`
- `POST https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/compute.yaml`
- `POST https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/compute.json`

Secondary introspection endpoints:

- `GET https://value-investment-tools.mycloudai.org/api/ai/manifest.json`
- `GET https://value-investment-tools.mycloudai.org/openapi.json`
- `GET https://value-investment-tools.mycloudai.org/sitemap.xml`
- `GET https://value-investment-tools.mycloudai.org/robots.txt`

## Rules

- Always fetch the schema before constructing a payload unless you have already read that exact schema during the current task.
- Use exact field keys from the schema. Do not invent field names from memory.
- Send all values inside the top-level `inputs` object.
- Prefer YAML when following a YAML-first flow; prefer JSON when constructing payloads programmatically.
- Treat all returned numbers as model outputs, not ground truth.
- Check whether returned `inputs` match your intended assumptions.
- If `warnings` is non-empty, surface the normalization or mapping behavior in your answer.
- If the user asks for a ticker-driven workflow, mention that the web UI can pull an FMP research bundle and prefill several tools.

## Minimal Agent Pattern

1. Discover tools:

```bash
curl https://value-investment-tools.mycloudai.org/api/ai/tools.yaml
```

2. Read one schema:

```bash
curl https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/schema.yaml
```

3. Send compute request:

```bash
curl -X POST \
  https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/compute.yaml \
  -H "Content-Type: application/yaml" \
  --data-binary $'inputs:\n  winRate: 60\n  payoffRatio: 2\n'
```

4. Read the response in this order:

- `warnings`
- echoed `inputs`
- `summary`
- `details`
- `charts`
- `narrative`

## Response Shape

Typical compute responses include:

- `kind`
- `version`
- `computedAt`
- `tool`
- `warnings`
- `inputs`
- `summary`
- `details`
- `charts`
- `narrative`

Use `warnings` and echoed `inputs` to detect schema mismatch, alias mapping, or unintended defaults.

## Example: Discovery To Tool Call

Use this pattern when the user asks a question but has not named a tool.

1. Read `https://value-investment-tools.mycloudai.org/api/ai/tools.yaml`.
2. Match the user request against each tool's `purpose` and `scenario`.
3. Pick the best route.
4. Read that route's schema.
5. Construct `inputs` with exact schema keys.
6. Call `compute.yaml` or `compute.json`.
7. Verify the response `inputs` echo what you intended to send.

## Example: Kelly Position Sizing

Useful when the user asks how much capital to allocate to one trade.

```bash
curl -X POST \
  https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/compute.yaml \
  -H "Content-Type: application/yaml" \
  --data-binary $'inputs:\n  winRate: 60\n  payoffRatio: 2\n'
```

Interpretation priority:

- `Full Kelly` is the theoretical maximum fraction.
- `Half Kelly` is the more practical implementation for most users.
- `风险提示` is a textual safety flag, not a compliance statement.

## Example: Two-Stage DCF

Use this when the user wants fair value for a relatively stable business.

1. Read the schema for `valuation/dcf-two-stage`.
2. Fill inputs such as `baseFcf`, `growthRate`, `wacc`, `terminalGrowthRate`, `netCash`, `sharesOutstanding`, and `currentPrice`.
3. Post the YAML payload.
4. Use `合理股价`, `相对当前价空间`, and `终值占比` as the top-level output summary.

## When To Use Which Tool

- `valuation/dcf-two-stage`: stable company valuation.
- `valuation/dcf-reverse`: infer what growth the market is pricing in.
- `health/f-score`: cheap but improving versus value trap screening.
- `health/z-score`: bankruptcy-risk style warning.
- `risk/kelly`: position sizing.
- `risk/margin-of-safety`: weighted valuation blend.

## Failure Handling

- If a tool is missing or a route returns 404, refresh `/api/ai/tools.yaml` and choose a valid route.
- If a compute result looks wrong, compare the echoed `inputs` with the payload you intended to send.
- If YAML parsing fails, simplify the payload to only `inputs` plus scalar values.
- If field names are uncertain, re-read the schema and stop guessing.
- If the user wants manual exploration, prefer the web UI for human analysis and keep programmatic calls on the API side.
