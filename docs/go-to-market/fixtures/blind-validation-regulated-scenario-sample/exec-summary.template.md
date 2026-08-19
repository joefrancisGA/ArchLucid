> **Reviewed:** 2026-07-25

# Blind insight validation — sponsor summary (template)

**Fixture / packet:** Synthetic regulated healthcare data platform (demo-safe)
**Sessions aggregated:** _(fill after ≥3 sessions)_

## Headline metrics (fill from completed scoring sheets)

| Metric | ArchLucid arm | Manual AI arm | Interpretation guardrail |
| --- | --- | --- | --- |
| Mean novelty (1–5) | | | Do not publish without ≥3 blind sessions |
| Mean surprise factor (1–5) | | | High O-rate ≠ failure; low N-rate = differentiation risk |
| Mean decision impact (1–5) | | | Single session is directional only |
| X / wrong findings (count) | | | Any critical X → engineering priority |
| Reuse intent (yes/maybe/no) | | | Not a product claim until cohort complete |

## Decision guidance

- **Advance insight narrative** when ArchLucid N-rate or mean surprise ≥ manual arm across ≥3 sessions.
- **Hold messaging** when N-rate <15% or reuse intent ≤2/5 — run more sessions, not more features.
- **Engineering priority** when critical X findings appear — faithfulness/retrieval, not GTM expansion.

## Evidence honesty

- Execution mode on fixture: **simulator**
- Evidence basis: **demo-derived**
- Do not convert demo-derived fixture output into customer outcomes.

Protocol: `docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md` (#blind-insight-validation; alias: `Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`)
