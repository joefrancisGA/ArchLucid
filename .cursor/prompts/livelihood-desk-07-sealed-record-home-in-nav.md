# LD-07 — Sealed review records have a Working nav home

**Do not fork LI-06** for the list **page** — `/governance/sealed-records` already exists. This file is **discoverability**: Working primary nav and Home must treat the sealed record as a durable object, not a detail URL you already have to know.

## Goal

A Working-mode architect (and a governance-lead) can open an index of sealed review records from primary nav: title, version, committed date, link to the review and the sealed record. Trimming a detail URL still must not 404 (keep the list page). Do not invent a second object model.

## Why

The sealed record is the artifact an architect is paid to produce. The IA assessment found it reachable only from review detail. LI-06 added a list route. If Working nav still omits it, Save-and-exit / “show me every signed decision” still dumps the user into the decision register with no stated relationship. Casual products hide proof artifacts behind the last wizard step. Livelihood tools put the work product in the file menu.

## Context

- `archlucid-ui/src/app/(operator)/governance/sealed-records/page.tsx`
- `archlucid-ui/src/lib/signed-records-paths.ts` — `SIGNED_RECORDS_LIST_PATH`
- Nav builders: `pilot-nav-group-builder.ts`, governance group builders, `filterNavGroupsForWorkingProfessionalMode`
- Decision register `/governance/decision-register` — do not merge the two; add a one-line relationship on each if missing
- Command palette destinations
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Working Review work or Governance group: a **Sealed review records** (sentence case) link to `SIGNED_RECORDS_LIST_PATH`. Do not hide it behind first commit if the user already has authority to see governance — empty index is honest.
2. List columns: title, version, committed date, link to review, link to sealed record. Reuse the existing page; do not build a second table stack.
3. Command palette: “Sealed review records” navigates to the list (Working and Guided).
4. Decision register and sealed-records list each state how they differ (dispositions vs sealed packages) in one sentence — no new hub.
5. Vitest / nav drift: Working nav includes the list href; trimming `/governance/sealed-records/{id}` to the list does not 404; palette search finds it.

## Acceptance criteria

- Working user can reach the sealed-records index from the sidebar without a deep link.
- Empty tenant shows an empty index, not a 404 and not Claims Intake.
- Desktop review tabs are unchanged (this is nav, not the review strip).
- No TB-645 “manifest” label regression.

## Constraints

- Do not collapse review workspace tabs.
- Do not add a third reporting dashboard.
- Do not implement GTM proof-packet cohorts.
