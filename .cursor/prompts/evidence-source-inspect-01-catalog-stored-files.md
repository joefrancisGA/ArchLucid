# ESI-01 — Catalog stored evidence files (do not list blobs as source of truth)

**Do not fork** evidence-graph, sealed-record artifact preview, or ZIP bundle export. **Do not** treat `sessionStorage` or the generated brief’s “Attached files:” list as the catalog.

## Goal

A run has a **server-side inventory of stored evidence files** (id, original file name, content type, byte length, uploaded UTC, blob pointer). The review UI can later open/download **only** rows that have an id in this catalog.

`RunDetailEvidenceInventoryItem` (and create-home capture items) gain an explicit **kind** so later prompts cannot make citation-only rows look downloadable:

- `stored-file` — bytes exist in the catalog
- `architecture-brief` — submitted prose, not a file
- `citation` — source name parsed from a finding snippet; original may not be stored

## Why

Bulk upload already writes blobs (`evidence/{runId:N}/{evidenceItemId}_{safeBaseName}`) but returns ids only on the POST response. There is **no list API** and **no SQL row**. `IArtifactBlobStore` has `WriteAsync` / `ReadAsync` / `TryGetExistingUriAsync` — **no List**. Create-home reconstructs names from `sessionStorage`. Intake records names in the brief. Click-to-open cannot be honest until stored files have durable ids.

## Context

- `ArchLucid.Application/Evidence/BulkEvidenceUploadService.SingleFile.cs` — blob write; id is in-memory only
- `ArchLucid.Api/Controllers/Authority/EvidenceBulkUploadController.cs` — `POST /v1/architecture/review/{runId}/evidence/bulk`
- `ArchLucid.Core/Persistence/ApplicationPorts/BlobStore/IArtifactBlobStore.cs`
- `archlucid-ui/src/lib/runs/run-detail-evidence-inventory.ts`
- `archlucid-ui/src/lib/runs/run-detail-create-home-captured-evidence.ts`
- `archlucid-ui/src/lib/intake-attached-file-names.ts`
- Unified DDL: `ArchLucid.Persistence/Scripts/ArchLucid.sql` (and `ArchLucid_Unified_Schema.sql` if still mirrored)
- Tenant isolation: ADR 0037 (catalog routing + scope predicates + blob prefix). Do not add RLS.

## What to build

1. **SQL catalog** (name may vary; one class per file). Suggested columns: tenant/workspace/project (match sibling run-scoped tables), `RunId`, `EvidenceItemId`, original file name, content type, byte length, blob URI, `CreatedUtc`, actor. Unique on `(RunId, EvidenceItemId)` inside the tenant catalog. Numbered migration **and** unified schema file. Next migration number: **re-read** `ArchLucid.Persistence/Migrations/` at implementation time (do not guess).
2. **Write the row in the same upload path** as `UploadSingleEvidenceFileAsync` (and ZIP-expanded entries). Partial-failure uploads must still persist rows for files that landed.
3. **`GET /v1/architecture/review/{runId}/evidence/files`** (or equivalent under the existing evidence route prefix). Returns the catalog for the scoped run. Empty list is valid. 404 when the run is not in scope.
4. Type the inventory derive: attached-brief names and finding snippets stay in the table, but `stored-file` is **only** when a catalog id matches (by id, then by case-insensitive file name if a single unambiguous match). Unmatched names → `citation` or `architecture-brief`.
5. OpenAPI snapshot + UI generated types. Application + API tests: upload then list; other-tenant run id 404; empty run returns `[]`.

## Acceptance criteria

- After bulk upload, a second GET (new session, no `sessionStorage`) returns the files with stable ids.
- Inventory derive tests: Word file in catalog → `stored-file`; snippet `storageAccount.bicep:42` with no catalog row → `citation`; brief row → `architecture-brief`.
- No blob-container listing API. No public URLs in the list DTO (id + metadata only).

## Constraints

- Do not implement download or preview UI in this prompt (ESI-02/03/04).
- Do not change ingestion parsers.
- Do not backfill historical blobs unless cheap and scoped; if skipped, document that pre-catalog uploads remain name-only until re-upload (ESI-06/05 honesty).
- Check nulls. Tenant scope on every query.
