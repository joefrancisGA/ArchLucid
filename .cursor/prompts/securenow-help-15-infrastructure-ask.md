# SH-15 — Grounded Ask `/governance/infrastructure/ask`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 for infrastructure Ask: grounded questions about inventory evidence with citation-backed answers and honest insufficient-evidence outcomes. Unscoped empty: open a resource hub first. Simulator mode is a demo template, not a live model guarantee. Not Approval. Not architecture “ask review questions”.

## Why

Prefix steal + Learn more `cloud-connections`. Architecture has a different Ask (`/insights/ask-review-questions` → prior-manifest-retrieval). Do not mix them.

Live: `GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD`, claim discipline, unscoped title/body in `governance-infrastructure-copy.ts`.

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx`
- Home: “Ask grounded questions about inventory evidence with citation-backed answers.”

## What to build

1. Prefix `/governance/infrastructure/ask`. Reuse lead + unscoped empty. Next = pick resource scope, ask, follow citations; configure = inventory snapshots. Actions: resource explorer. Do not CTA architecture Ask.
2. Learn more omit or dedicated slug. Do **not** map to `prior-manifest-retrieval`.
3. Vitest: not Approval; Learn more not cloud-connections.

## Acceptance criteria

- F1 includes citation-backed / insufficient-evidence honesty.
- Simulator labeled as on-page (deterministic demo), not production intelligence.

## Constraints

- Do not invent model names or API paths in Category-1.
- Stage Ask row + topic map + tests.
