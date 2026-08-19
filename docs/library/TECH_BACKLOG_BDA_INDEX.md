> **Scope:** Contributor-reference — engineering index for buyer-demo defect remediation (**TB-273**). Canonical per-issue detail remains in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) § TB-273 (**BDA-001…150**, all 150 issues). Re-validation spot-check: **TB-275** (2026-06-04). Does not change `(A)` assessment scores per `Assessment-Scope-V1_1.mdc`.
> **Reviewed:** 2026-07-23

# TB-273 / BDA batch tracker

## Status (2026-06-01)

| Batch | BDA IDs | Status | Notes |
|-------|---------|--------|-------|
| **5CY-demo** | 024, 150, 001, 012–014, 002, 004, 008–009, 017 | **Done** | `buyer-demo-content-gating.ts`, env CI guard, golden-path import guard, fabrication + anchor fixes |
| **5CZ-demo** | 003–007, 010–011, 015–023 | **Done** | `buyer-demo-persona-labels.ts`, audit/governance/reviews/sponsor P0 persona + misleading-claim sweep |
| **5DA-demo** | 025–080 | **Done** | Home/reviews/sponsor P1 wave 1 — `buyer-polish-copy`, terminology, sponsor surface guards |
| **5DB-demo** | 081–133 | **Done** | Governance/audit/finding/ask/manifest/graph P1 wave 2 |
| **5DC-demo** | 134–150 | **Done** | P2 polish — home casing, neutral runs count, sponsor scorecard/trend/KPI copy, in-app help links |
| **5DN-demo-deferred** | 135, 139, 146 | **Done** | Home hero/section hierarchy; unified sponsor dashboard metrics; manifest summary `topDecisionSynopses` + UI excerpts |
| **5DT-demo-revalidate-p0** | 001, 006–009, 015 (TB-275) | **Done** | Audit completion copy; finalize anchor; illustrative cost KPI; explicit-demo audit inject gating |

## P0 checklist (24)

| ID | 5CY | Title (short) |
|----|-----|----------------|
| BDA-001 | ✓ | Finalize anchor → `#finalize-review` |
| BDA-002 | ✓ | Governance read-only copy (no “evaluation sample”) |
| BDA-003 | ✓ | Personas Taylor/Jordan in governance |
| BDA-004 | ✓ | Governance queue static spine gating |
| BDA-005 | ✓ | “Demonstration rule-set” badge |
| BDA-006 | ✓ | Audit `demo-tenant` ids |
| BDA-007 | ✓ | Audit fictional actors |
| BDA-008 | ✓ | “Audit trail complete” heading |
| BDA-009 | ✓ | Sample audit trail admission removed (buyer) |
| BDA-010 | ✓ | Audit appendix demo ids |
| BDA-011 | ✓ | Persona→role map |
| BDA-012 | ✓ | Fabricated decision panel |
| BDA-013 | ✓ | Fabricated confidence |
| BDA-014 | ✓ | Fabricated audit linkage |
| BDA-015 | ✓ | Demo-derived ROI label |
| BDA-016 | ✓ | Sponsor placeholders |
| BDA-017 | ✓ | Sponsor export demo merge |
| BDA-018 | ✓ | Simulator fallback banner |
| BDA-019 | ✓ | Demonstration KPI $94k |
| BDA-020 | ✓ | Illustrative pricing |
| BDA-021 | ✓ | Demonstration workspace tip |
| BDA-022 | ✓ | Package card personas |
| BDA-023 | ✓ | WhyArchLucid pack banner (CI documents demo-only) |
| BDA-024 | ✓ | Demo banner env gating |

## P2 / cross-cutting

| ID | 5CY | Title (short) |
|----|-----|----------------|
| BDA-150 | ✓ | Mock KPI / illustrative spine import guard |

## TB-275 re-validation (2026-06-04) — **Done** (batch **5DT-demo-revalidate-p0**)

Spot-check residuals closed against existing **BDA-001…150** ids — see `TECH_BACKLOG.md` § TB-275.

## How to pick up

1. Read the batch row above and the matching rows in `TECH_BACKLOG.md` § TB-273.
2. Prefer extending `buyer-demo-content-gating.ts` for env/demo leakage before one-off copy edits.
3. Mark ✓ in this index when a BDA row is fully closed (code + test + backlog row note).
4. For **TB-275**, log fixes against existing **BDA-NNN** ids — no new numbering.
