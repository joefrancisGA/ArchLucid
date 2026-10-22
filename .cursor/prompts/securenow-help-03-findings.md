# SH-03 — Findings help article and `/governance/findings` drawer

**Do not** rewrite Architecture findings help. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Assigned-to-me is **SH-04** (different page job). This prompt is the tenant findings queue + `/help/findings`.

## Goal

Security findings Category-1 and `/help/findings` describe **ARC-AMPE / cloud-inventory findings**: triage open findings raised by assigned packs against Azure inventory evidence, assign owners, inspect evidence hubs. Remove “architecture concern identified during a review”, decision-register CTAs, and search-review-evidence as the primary next step. Architecture `:3000` keeps review-finding copy.

## Why

`FINDINGS_CONTEXTUAL_HELP_ROWS` for `GOVERNANCE_FINDINGS_PATH`: “Track architecture risks from accepted findings… Rows appear after findings are accepted or approval decisions are recorded in reviews.”

`findings-help-guide-content.ts`: subtitle “Understand architecture risks…”, overview “A finding is an evidence-backed architecture concern identified during a review”, anatomy “architecture concern”, primary actions include Search review evidence (`/insights/search-review-evidence`) and View approval (`/governance/decision-register`). Those insights/decision-register routes are not Security nav.

SecureNow compliance home: “Triage open findings raised by ARC-AMPE rules against connected cloud inventory evidence.”

## Context

- `archlucid-ui/src/lib/contextual-help/findings-rows.ts`
- `archlucid-ui/src/lib/findings/findings-help-guide-content.ts`
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts` — `/governance/findings` → slug `findings` (slug can stay)
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- Findings queue client under `archlucid-ui/src/app/(operator)/governance/findings/`
- `/help/findings` drawer in the same findings-rows module

## What to build

1. Security Category-1 for `/governance/findings`: what = ARC-AMPE/cloud-evidence findings queue; next = open a finding, assign owner, follow resource hub / audit lineage; empty = after packs apply to inventory (not after reviews finalize); configure = policy packs / Azure connection. Actions: open policy packs, assigned-to-me, or resource explorer — not decision-register / search-review-evidence.
2. Security `/help/findings` body: overview, anatomy, primary actions, related docs. Keep severity/status/owner language if the live queue still shows those columns. Replace review-finalize language with pack assignment + inventory evidence.
3. `/help/findings` drawer: live dest is the findings queue; do not send Security users to decision-register.
4. Vitest both lines. Learn more slug `findings` can stay if the article is product-line-aware.

## Acceptance criteria

- Security F1 on `/governance/findings` does not mention architecture reviews or approval decisions as the source of rows.
- `/help/findings` in Security does not CTA Architecture-only routes.
- Architecture findings help still defines review findings and may keep decision-register / search-review-evidence.

## Constraints

- Do not merge assigned-to-me copy into this hub (SH-04). Prefix `/governance/findings` will currently also match `/governance/findings/assigned-to-me` — SH-04 must add a **longer** prefix. If you ship SH-03 first, add a TODO comment or land the assigned-to-me prefix stub so the steal does not worsen.
- Stage findings help + contextual rows + tests.
