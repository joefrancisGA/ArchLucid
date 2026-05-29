> **Scope:** Operator cookbook — time-boxed narrative for completing a first credible review in one sitting; not the canonical checklist.

# First credible review in one sitting

> **Canonical checklist:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md). This page is a **time-boxed narrative** for operators who want one sitting from preflight to sponsor-ready proof.

## Expected timing (guidance only — not SLA)

| Phase | Typical target | Proof artifact |
| --- | --- | --- |
| Platform preflight | 5–15 min | `pilot-preflight` / health |
| Evidence upload | 5–20 min | extractor ZIP or sample package |
| Create + execute review | 10–30 min | run detail / pipeline |
| Finalize (commit) | 2–10 min | golden manifest |
| Proof collection | 5–15 min | `first-pilot-timing-budget.md` |

Measured timings appear in **`first-pilot-timing-budget.json`** after `./scripts/collect-first-pilot-proof.ps1` (or `archlucid pilot proof`).

## Minimal path

1. **Platform ready** — `archlucid pilot preflight --api-base-url <url>` (or operator Home readiness cockpit).
2. **Evidence** — upload extractor ZIP or open sample package; acknowledge evidence on Home.
3. **Review** — create → execute → finalize one architecture review.
4. **ROI baselines** — capture hours, reviews/quarter, and architect cost on the operator scorecard (`/scorecard#roi-baselines`) before sponsor PDF.
5. **Proof** — `./scripts/collect-first-pilot-proof.ps1 -BaseUrl <url> -RunId <committed-run-id>`; read **`first-pilot-command-center.md`** NEXT ACTION.
6. **Sponsor send** — only when AI readiness (PilotStrict) and ROI gates pass on review detail.

## Demo fallback

If buyer evidence is not ready, use the curated sample review with **demo-derived** labels — do not circulate externally as customer proof.

## Deferred (not required in one sitting)

V1.1 connectors, governance dry-runs beyond one optional step, and procurement CPA items — see [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md).
