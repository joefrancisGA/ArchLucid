> **Scope:** Evidence source inspect wave close audit (ESI-01–ESI-08).

# Evidence source inspect wave close audit (ESI-08)

> **Date:** 2026-09-12  
> **Verdict:** **Shipped** — stored files are openable from the review Evidence tab with preview-first honesty; source bytes are **not the sealed review record**.  
> **Spine:** [`EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md`](EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md)

## Done tests

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | SQL catalog for stored files | **Yes** | `RunStoredEvidenceFiles` |
| 2 | Authorized download/stream API | **Yes** | `ReviewStoredEvidenceFilesController` |
| 3 | Stored rows are controls, citations are not | **Yes** | `RunDetailEvidenceInventorySection.test.tsx` |
| 4 | Preview policy fail-closed for unsafe types | **Yes** | `run-stored-evidence-preview-policy.ts` |
| 5 | Help describes inspect on review | **Yes** | evidence-intake help + `inspect-stored-evidence` topic |
| 6 | Honesty: not the sealed record | **Yes** | `evidence-source-inspect-sealed-honesty.ts` |

## Do not claim

- Citation-only rows are downloadable
- Source file bytes equal the sealed package ZIP or **the sealed review record**
- Public blob SAS URLs
