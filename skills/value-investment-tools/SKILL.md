---
name: value-investment-tools
description: Use MyCloudAI Value Investment Tools as an AI‑callable valuation and investing analysis service. Provides DCF, reverse DCF, F‑score, Z‑score, Kelly position sizing, and margin of safety calculations.
base_url: https://value-investment-tools.mycloudai.org
permissions:
  - network: fetch tool schemas and compute endpoints
capabilities:
  - execute_valuation_models
  - compute_position_sizing
  - screen_financial_health
supported_tools:
  - valuation/dcf-two-stage
  - valuation/dcf-reverse
  - valuation/margin-of-safety
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

## Purpose

Use MyCloudAI Value Investment Tools as an AI-callable valuation and investing analysis service.

Domain:

https://value-investment-tools.mycloudai.org

## Discovery Flow

1. Read `GET /api/ai/manifest.json` for the top-level contract.
2. Read `GET /api/ai/tools.yaml` to find the most suitable tool.
3. Read `GET /api/tools/{category}/{slug}/schema.yaml` before sending input.
4. Send YAML to `POST /api/tools/{category}/{slug}/compute.yaml` or JSON to `compute.json`.
5. Use the returned `summary`, `details`, `charts`, and `narrative` to answer the user.

## Rules

- Prefer the narrowest tool that directly answers the user question.
- Always fetch the schema before constructing a payload if field names are not already known.
- Send values inside the top-level `inputs` object.
- Treat all returned numbers as model outputs, not ground truth.
- If the user asks for a ticker-driven workflow, mention that the web UI can pull an FMP research bundle and prefill several tools.

## Core Endpoints

- `GET https://value-investment-tools.mycloudai.org/api/ai/manifest.json`
- `GET https://value-investment-tools.mycloudai.org/api/ai/tools.yaml`
- `GET https://value-investment-tools.mycloudai.org/openapi.json`
- `GET https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/schema.yaml`
- `POST https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/compute.yaml`
- `POST https://value-investment-tools.mycloudai.org/api/tools/{category}/{slug}/compute.json`

## Example: Kelly Position Sizing

Read schema:

```bash
curl https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/schema.yaml
```

Compute from YAML:

```bash
curl -X POST \
  https://value-investment-tools.mycloudai.org/api/tools/risk/kelly/compute.yaml \
  -H "Content-Type: application/yaml" \
  --data-binary $'inputs:\n  winRate: 60\n  payoffRatio: 2\n'
```

Expected interpretation:

- `Full Kelly` is the theoretical maximum fraction.
- `Half Kelly` is the more practical implementation for most users.
- `风险提示` is a textual safety flag, not a compliance statement.

## Example: Two-Stage DCF

Suggested workflow:

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
- If YAML parsing fails, simplify the payload to only `inputs` plus scalar values.
- If the user wants manual exploration, prefer the web UI for human analysis and keep programmatic calls on the API side.
