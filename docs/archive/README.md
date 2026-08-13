> **Reviewed:** 2026-07-23
> **Scope:** Index for historical design-session logs and consolidated archive series — not maintained against the current codebase.

# docs/archive — historical design-session logs

This folder contains **historical implementation records** and superseded notes. Files here are **not maintained** for accuracy against the current codebase (class names, tables, and flows may be outdated). They are kept for archaeological reference.

**Current documentation** starts at the **canonical Day-1 docs** — **[`../onboarding/day-one-developer.md`](../onboarding/day-one-developer.md)** (developer), **[`../onboarding/day-one-sre.md`](../onboarding/day-one-sre.md)** (SRE), **[`../onboarding/day-one-security.md`](../onboarding/day-one-security.md)** (security), **[`../OPERATOR_QUICKSTART.md`](../library/customer-facing/OPERATOR_QUICKSTART.md)** (operator commands) — plus a short hub at **[`../START_HERE.md`](../START_HERE.md)**.

These change-set files are **immutable historical records** where noted. They capture incremental prompt logs, deferred-backlog decisions, and exact delivery scope for each change set as it was produced.

Do **not** edit archived change-set bodies. If a decision changes, write a new ADR or add a new CHANGELOG entry.

| File | What it covers |
|------|---------------|
| [CHANGE_SET_SERIES_55R_59R.md](CHANGE_SET_SERIES_55R_59R.md) | **Consolidated** 55R–59R prompt logs (operator shell, RC hardening, Playwright E2E, product learning, planning bridge) |
| [../assessments/LATEST_GPT55.md](../assessments/LATEST_GPT55.md) | **Consolidated** April 2026 marketability snapshots (mixed + SaaS-only framing) |
| [../assessments/LATEST_GPT55.md](../assessments/LATEST_GPT55.md) | **Consolidated** 2026-04-23 quality assessment (73.20%) + Cursor prompts |
| [../assessments/LATEST_GPT55.md](../assessments/LATEST_GPT55.md) | **Consolidated** 2026-04-25 usability assessment (69.52%) + Cursor prompts |

**Live assessments** (not under this folder): [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) · [`../assessments/LATEST_EXPOSURE.md`](../assessments/LATEST_EXPOSURE.md). Historical weighted passes live in the consolidated series rows above (former `archive/assessments/` tree removed).

For a summarized, navigable view of all releases use **[docs/CHANGELOG.md](../CHANGELOG.md)**.
