# IS-14 — Working IA is one lifecycle you can find

**Do not fork WD-10** for dual-path cards (IS-02 owns primary CTA). This file is **findability**: drafts list in Working nav, sealed-record list that is not a 404, and a canonical pointer on overlapping report pages (CD-09 leftover). Do not restore breadcrumbs (**TB-2090**). Do not manufacture an Evidence hub the backend cannot support.

## Goal

Working nav includes **Drafts** (`ARCHITECTURES_LIST_PATH`). Sealed records have a real index route (trim of a detail URL must not 404). Scorecard / sponsor / value-report pages that overlap state which is canonical (CD-09). Working does not grow a sixth dashboard.

## Why

IA assessment: drafts stranded off-nav; sealed record — the career artifact — has no home; six report surfaces. All-day use needs three nouns: drafts, in-flight packages, sealed records.

## Context

- `docs/architecture/information_architecture_assessment_and_backlog.md` IA-001, IA-002, IA-005
- `ARCHITECTURES_LIST_PATH`
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts`
- Sealed list: `/governance/sealed-records` or `/signed-records` rewrite
- `operator-primary-cta-inventory.ts`
- CD-09 duplicate report pointer

## What to build

1. Working nav: Drafts visible. Guided may keep it behind progressive disclosure.
2. Sealed-records index page: title, committed date, link to review + sealed record. Parent URL of a detail is not 404.
3. On overlapping report routes, one-line canonical pointer (CD-09) if still missing.
4. Vitest: Working nav includes drafts href; sealed index renders; Guided can omit drafts from the default strip.

## Acceptance criteria

- Save-and-exit is not a trap: Drafts is in Working nav.
- Trimming a sealed-record detail URL shows a list.
- No desktop More menu for review tabs.

## Constraints

- Do not reintroduce Step 1 / One lifecycle copy (ADR 0069).
- Do not implement Evidence-as-peer-inventory.
