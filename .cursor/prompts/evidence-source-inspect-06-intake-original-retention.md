# ESI-06 — Keep intake originals (PDF, DOCX, images, text) in the same catalog

**Depends on ESI-01.** **Do not** send PDF/DOCX **bytes** into context ingestion. Ingestion still receives extracted **text/plain** / **text/markdown**.

## Goal

Guided / first-pilot / wizard attachments that today are:

1. extracted to text (`buildIntakeContextDocumentsFromEvidenceFiles`), and/or
2. listed only as names in the generated brief (`appendIntakeAttachedFileNames`),

also **persist original bytes** through the **same catalog + blob path** as bulk upload (`UploadSingleEvidenceFileAsync` / ESI-01 rows).

Images and other accepted wizard types (`WizardEvidenceUploadZone` / `EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS`) that currently return `null` from `toIntakeContextDocument` must still be **stored** even when they contribute no ingestion document.

## Why

The owner named pictures and Word files. Intake is the first-review path. Without this prompt, ESI-03 will show those names as citations or brief attachments and **cannot** open them. That is worse than dead text.

## Context

- `archlucid-ui/src/lib/intake-context-documents-from-files.ts` — PDF/DOCX → extracted text; images dropped
- `archlucid-ui/src/lib/evidence-readable-text.ts`
- `archlucid-ui/src/app/(operator)/architecture/reviews/new/use-new-run-wizard-pending-evidence.ts`
- `archlucid-ui/src/lib/wizard-pending-evidence-upload.ts`
- `ArchLucid.Application/Evidence/BulkEvidenceUploadService` — reuse; do not fork a second blob layout
- Accepted types copy: `archlucid-ui/src/lib/bulk-evidence-upload-copy.ts`

## What to build

1. After run id exists, upload original `File` objects via the existing bulk evidence POST (or a thin internal reuse of the same application service). Do this **in addition to** building `ContextDocumentRequest` text payloads.
2. Order: do not block analysis on catalog write failure without an operator-visible recovery (what failed / what is intact / next step). Prefer: ingestion proceeds; catalog failure is a visible warning that originals are not inspectable.
3. Map `evidenceItemIds` from POST into ESI-01 rows (server already writes rows if ESI-01 landed on the upload path).
4. Tests (UI + API as needed): PNG attached on first-pilot → catalog contains the PNG; DOCX still sends extracted text to create-run documents **and** a stored-file row; empty/unreadable extract still stores the original if bytes exist.
5. Honesty: inventory labels unmatched pre-ESI-06 names as not stored (ESI-01 kind rules).

## Acceptance criteria

- New intake with a diagram PNG: Evidence tab can open it after ESI-03/04 (or list id after ESI-01).
- Authority pipeline still does not parse PDF bytes (`SupportedContextDocumentContentTypes` unchanged).
- No second blob container naming scheme.

## Constraints

- Data minimization is an accepted tradeoff — originals are retained for inspectability. Do not add a new retention product; follow existing tenant/blob lifecycle. Mention the tradeoff in the PR, not in buyer marketing copy.
- Do not expand ZIP-in-intake beyond what bulk upload already does.
- Do not store executables. Stay on the existing accepted-extension allowlist.
- Check nulls; one class per file if new C# types are required.
