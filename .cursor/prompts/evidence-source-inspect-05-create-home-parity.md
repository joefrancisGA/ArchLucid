# ESI-05 — Create-home captured evidence list uses the catalog

**Depends on ESI-01.** **Do not fork** `BulkEvidenceUpload` upload UX. **Do not** keep `sessionStorage` as the source of truth.

## Goal

The architecture-created home captured-evidence table (`RunDetailCreateHomeCapturedEvidenceInventory`) lists the same **stored files** as ESI-01’s GET. After refresh or a new browser tab, uploaded files still appear and (once ESI-03/04 exist) are openable the same way.

`sessionStorage` (`archlucid_create_home_captured_evidence_v1_`) may remain a **cache** but must not be the only inventory.

## Why

TB-1846 residuals already noted create-home Evidence as upload-only versus review-package inventory. Capture persistence today is session-scoped, so the owner’s “click the attached document” fails as soon as the tab is gone — even when blobs exist.

## Context

- `archlucid-ui/src/components/runs/RunDetailCreateHomeCapturedEvidenceInventory.tsx`
- `archlucid-ui/src/lib/runs/run-detail-create-home-captured-evidence.ts`
- `archlucid-ui/src/components/BulkEvidenceUpload.tsx` / `onUploadSummary`
- ESI-01 list DTO
- Empty copy in `run-detail-create-home-evidence-copy.ts`

## What to build

1. Load catalog files for the run on create-home Evidence (React Query or the same fetch path review detail uses). Merge optimistic upload results into that list by evidence item id.
2. Table columns stay compact (File, Uploaded). Add open/download **only if ESI-03 controls already exist** — extract a shared `StoredEvidenceFileCells` (or similar) rather than copy-paste markup. If ESI-03 is not merged yet, list from catalog still ships; controls wait.
3. Empty state: distinguish “none uploaded” from “catalog not yet available (legacy session-only names).”
4. Vitest: mock list GET → rows; sessionStorage-only names without catalog ids are not downloadable.
5. Stop writing the session key as the primary store once the GET works; delete key on successful catalog read **or** leave it but ignore it when GET returns (prefer ignore).

## Acceptance criteria

- Upload on create-home → refresh → file still listed from the API.
- No claim that create-home files are the sealed review record.

## Constraints

- Do not add Evidence-tab collapse or a desktop **More** menu.
- Do not replace bulk upload limits/copy (`BULK_EVIDENCE_UPLOAD_HANDLING_HELPER`).
- Guided intake originals are ESI-06, not this prompt.
