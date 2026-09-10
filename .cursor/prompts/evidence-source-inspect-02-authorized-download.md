# ESI-02 — Authorized download / stream of a stored evidence file

**Depends on ESI-01.** **Do not** mint public SAS URLs or put blob URIs in the browser.

## Goal

An authorized caller can fetch the **original bytes** of one catalogued evidence file for a run:

- `GET .../evidence/files/{evidenceItemId}` with `Content-Disposition: attachment` (download)
- Same resource with inline disposition **or** a `?disposition=inline` / preview route for ESI-04 (choose one; document it)

Reuse `ArchLucid.Api/ApiFileResults.cs` (`SimpleBytes` or `RangeBytes`). Decode the existing **base64** payload written by `BulkEvidenceUploadService` — do not change the blob port to binary in this prompt.

## Why

Bytes already sit in `artifacts` / `evidence/{runId}/{id}_{name}`. Without a scoped GET, the UI cannot open them. Filename-as-link with no API is a lie.

## Context

- ESI-01 catalog (id → blob URI + file name + content type)
- `EvidenceBulkUploadController` — keep POST as `ExecuteAuthority`
- `ApiFileResults` / `FileWithRangeResult`
- `AuditEventTypes` (`EvidenceBulkAttached` already exists) — add a **read** event, e.g. `EvidenceSourceDownloaded` / `EvidenceSourceOpened`, on `ArchLucid.Core/Audit/AuditEventTypes.Findings.cs` (or the matching partial). Register in required-audit tests if this event type is in that set.
- ADR 0037 IDOR: wrong tenant / unknown id → **404** (not 403 that confirms existence)

## What to build

1. Application service: load catalog row by scope + runId + evidenceItemId; `ReadAsync` blob; null/missing → not found; decode base64; return bytes + content type + original file name.
2. API GET on the review evidence route. **ReadAuthority** (or the same policy the review-detail GET uses) so a reviewer who can open the review can inspect sources. Do **not** require `ExecuteAuthority` unless review detail already does — match the read surface.
3. Content type from the catalog row (do not sniff untrusted bytes into HTML). Default `application/octet-stream` when missing.
4. Audit append on successful download/open (actor, runId, evidenceItemId, file name — no payload).
5. Tests: happy path bytes match upload; missing id 404; other-tenant 404; sealed run still returns bytes (immutability of seal does not delete submitted files). OpenAPI snapshot.

## Acceptance criteria

- Upload a small `.txt` via bulk, list (ESI-01), GET file → 200, correct bytes, `Content-Disposition` includes the original name.
- Browser never receives a storage account URL.
- Rate-limit: reuse or sibling of `evidenceBulkUpload` limiter if a download flood is cheap; otherwise document why the existing API limiter is enough.

## Constraints

- Do not render the file in this prompt (ESI-04).
- Do not execute or rewrite uploaded content.
- SVG / HTML content types: still return as **download** (`attachment`) even if inline is used for images/PDF — never `text/html` inline. ESI-04 will keep SVG as download-only.
- No `git add -A`. Stage only this prompt’s paths.
