# CD-15 — Remaining sponsor PDF / product-doc exports stay honest

**Do not fork WA-08** for in-app sponsor KPI/ROI honesty (`sponsor-review-coverage-honesty.ts`). This file is **remaining file exports**: product-documentation PDF, consulting DOCX, and any sponsor packet that still screenshots as all-clear when engines were quiet, MUST skipped, or typed-engine-protected applied.

## Goal

Working-mode PDF/DOCX/sponsor file builders reuse the same coverage honesty sentence already used on screen (quiet engines, skipped MUST, infeasible, typed-engine-protected). Do not invent a second claim language. Guided/demo sample packets may stay labeled as sample.

## Why

WA-08 closed the on-screen sponsor packet. Architects still email a PDF. If the file is cleaner than the desk, the desk honesty was theater.

## Context

- `archlucid-ui/src/lib/sponsor/sponsor-review-coverage-honesty.ts` — **reuse**
- Product documentation PDF builders (`ArchLucid.Application/Pilots/ProductDocumentationPdfBuilder.cs` and UI hrefs)
- Sponsor export / consulting DOCX paths — grep `sponsor` + `Pdf` / `Docx` rather than inventing a new pipeline
- `docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md` — evidence → finding → manifest honesty
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`

## What to build

1. Inventory live sponsor/product-doc export builders that summarize findings or a yes. Add the reused honesty block when coverage is incomplete or typed-engine-protected applies.
2. If an export cannot see coverage, fail closed with “coverage not on this file — see the sealed record” rather than an all-clear KPI page.
3. Vitest or focused .NET tests on the builder: quiet-engine fixture cannot omit the honesty sentence. Scoped compile if C# changes.

## Acceptance criteria

- A Working PDF cannot screenshot as cleaner than the review stamp.
- Sample/demo exports stay labeled sample.
- Gate `.cs` empty diff for `typed-engine-protected`.

## Constraints

- **Forbidden:** demoting typed engines; 40th coverage engine.
- Do not collapse review tabs.
- Proof/sponsor surfaces: keep evidence → finding → manifest labeling honest.
