---
name: al-beta
description: >-
  Read-only private-beta readiness report: priority top 10 (human or Cursor) plus
  at least fifteen Cursor suggestions. Inspects live master CI, LATEST_GPT55 weaknesses,
  ship gates, and GTM proof work. Use when the user invokes /al-beta or asks for
  private-beta readiness priorities.
disable-model-invocation: true
---

# /al-beta — private-beta readiness top 10

Follow the full workflow in `.cursor/commands/al-beta.md`.

## Invoke

```text
/al-beta
```

## Quick workflow

1. **Live CI** — `gh run list` on `master` for `ui-typecheck-on-push`, `private-beta-access-on-push`, OpenAPI refresh; `gh run view --log-failed` on red beta-critical jobs.
2. **Assessments** — `docs/assessments/LATEST_GPT55.md` §8, §0, §17, §4; `private_beta_access_prompt_07152026.md`.
3. **GTM** — `docs/go-to-market/GTM_BACKLOG.md` (**G-REAL-06**, **M-07**, Gate 1).
4. **Rank** — priority top 10 by private-beta impact; then **≥ 15 distinct Cursor suggestions** (second table).
5. **Report** — two markdown tables (priority + Cursor suggestions).

**Read-only.** No implement, commit, or push.

## Beta-critical checks

- `Operator UI: private-beta access-path (JwtBearer)`
- `.NET: OpenAPI v1 contract snapshot (fail-fast)`
- `CI: beta-readiness wiring guards`
- `.NET: fast core (corset)` / push corset sibling
- `Operator UI: typecheck (blocking)`
- Live ruleset vs `.github/rulesets/golden-cohort-gate-required-check.json`

## Related commands

- `/ship-next-improvement` — implement next Cursor engineering item
- `/show-next-improvement` — single-item preview
- `/show-all-improvements` — full Cursor-shippable queue
- `/al-bug` — hunt a concrete defect
