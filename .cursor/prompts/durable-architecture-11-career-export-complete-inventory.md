# DA-11 — Career export: no silent 20-finding cap

**Do not fork LK-09** (trail completeness gate). **Do not fork LK-14** (stamp measurement denominator). This prompt is **incomplete meeting artifacts**.

## Goal

Career-facing finding inventories cannot drop rows 21+ without a **blocking** honesty control.

1. `DEFAULT_MAX_FINDINGS = 20` in `adr-from-run-slices.ts` is not allowed for Working **career** ADR/MADR export. Either:
   - include **all** findings (paginate server-side if needed), or
   - if a cap remains, the export **refuses** to present as complete: title-page / banner **This export includes {n} of {total} findings** and Working download is disabled until the user confirms **Export incomplete sample** (eval/demo may keep a short sample **labeled sample**).
2. Print view (`package-print-view.ts`) already says it is not the sealed record — add showing N of M for findings listed. Do not claim print is the sealed package (honesty stays).
3. Board-pack / sponsor DOCX paths: same rule if they slice findings. Do not contradict TB-2132 above-fold sponsor export if that surface already includes the full set — then this prompt only adds the count line.

## Why

An ARB packet with twenty findings while the queue has sixty is a livelihood failure. Casual tools truncate for layout. Livelihood tools either ship the full inventory or refuse to look complete.

## Context

- `archlucid-ui/src/lib/adr-from-run-slices.ts` (`DEFAULT_MAX_FINDINGS = 20`, `EXCERPT_CAP`, `NARRATIVE_CAP`)
- `package-print-view.ts` (`PACKAGE_PRINT_COVERAGE_HONESTY_LINE`)
- LK-09 trail gate — still required; this is **finding count**, not trail buckets
- ADR 0073 / 0070 classification bands — do not drop checklist rows from the career inventory without counting them

## What to build

1. Shared completeness helper: `{ included, total, isComplete }`.
2. Working ADR export uses full list or labeled incomplete confirmation.
3. Vitest: 25 findings, Working career path → not silently 20; eval sample path labeled sample.
4. Keep excerpt/narrative caps (those are length, not inventory).

## Acceptance criteria

- Working cannot download an ADR that looks like the full finding set while `included < total`.
- Print still not a signed export.

## Constraints

- Do not unseal or rewrite sealed bytes (ADR 0039).
- Do not add engines.
- Meeting keepalive / BFF remains **LK-07**.
