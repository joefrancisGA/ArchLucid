<!-- Evidence-source-inspect Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 owner ask: on the ArchLucid review screen, attached
     documents / pictures / text files should be openable (and downloadable).
     Product framing: inspect the original evidence — not “every filename is a
     download link.” Do not implement from this index. -->

# Evidence source inspect — Composer prompt set (ESI-01–ESI-08)

On the review screen today, submitted files show as **dead text**. The Evidence tab (`RunDetailEvidenceInventorySection`) lists source name, kind, ingested time, and citation count, but the name is not a control. Create-home captured files (`RunDetailCreateHomeCapturedEvidenceInventory`) are the same. Reviewers cannot check the original that findings cite.

**Owner product framing (do not weaken):**

- Reviewers should **open the original evidence** from the review screen.
- Prefer **open / preview first**, with **Download** as a separate action.
- Do **not** make every inventory row a download. The table mixes stored files, the architecture brief, and names parsed from finding citations.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/evidence-source-inspect-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md`](../../docs/architecture/EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays (evidence, finding, sealed review record).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | UI lists names with no stored-file identity | **ESI-01** | SQL catalog + `GET` list; inventory row kinds |
| 2 | Blobs exist but nothing can fetch bytes | **ESI-02** | Authorized download/stream by evidence item id |
| 3 | Evidence table is dead text | **ESI-03** | Open link + Download button on **stored** files only |
| 4 | Click-to-download is the wrong default | **ESI-04** | In-app preview (image / text / PDF) |
| 5 | Create-home inventory is sessionStorage | **ESI-05** | Bind capture list to the catalog |
| 6 | Guided intake discards originals | **ESI-06** | Persist PDF/DOCX/image/text bytes on intake |
| 7 | Download must not impersonate the seal | **ESI-07** | Authz, sealed honesty, audit |
| 8 | Help / a11y / ratchet missing | **ESI-08** | Help copy, keyboard, tests that names are controls |

## Run order

**01 → 02 → 03.** Then **04** (preview uses 02). **05** after 01 (can parallel 03). **06** after 01 (writes the same catalog). **07** after 02 (authz + copy). **08** last.

| Prompt | Parallel? | Depends on | Do not fork |
|--------|-----------|------------|-------------|
| **ESI-01** Catalog | **First** | Bulk upload already writes blobs | Listing blobs as SoT; sessionStorage as SoT |
| **ESI-02** Download API | After 01 | Catalog ids | Public SAS URLs; unsigned blob URIs |
| **ESI-03** Review inventory UI | After 02 | Row kinds from 01 | Making citation rows downloadable |
| **ESI-04** Preview | After 02/03 | Stream endpoint | Executing uploaded SVG as HTML |
| **ESI-05** Create-home | After 01; parallel 03 | Catalog list | Keeping sessionStorage as the list |
| **ESI-06** Intake originals | After 01 | Same blob + catalog path | Sending PDF bytes into `text/plain` ingestion |
| **ESI-07** Authz + seal honesty | After 02 | Read vs Execute | Unsealing; calling files the sealed record |
| **ESI-08** Help / a11y / ratchet | After 03–05 | Affordances exist | Desktop tab **More** menu |

## What this set does *not* change

- Desktop review workspace **tabs** stay a full strip (no **More** / overflow).
- Sealed-manifest immutability (ADR 0039) — downloads of **submitted** files after finalize are allowed; bytes of the sealed package are not rewritten.
- Tenant isolation (ADR 0037) — catalog + blob prefix + IDOR tests; do **not** add SQL RLS.
- `IArtifactBlobStore` stays a UTF-8 string store (today bulk upload already writes **base64**). Do not convert the whole blob port to binary in this set.
- Context ingestion still parses **text/plain** and **text/markdown** only. ESI-06 keeps extraction for the authority pipeline and **stores originals beside it**.
- Evidence graph / sealed-record artifact preview (`artifactPreviewHref` / GAR) — different objects. Do not route submitted intake files through sealed-record artifact pages.
- ZIP bundle export of the committed package — leave as a separate export. This set is **per-file inspect**.
- Do **not** add a 40th coverage engine. Do **not** merge `DraftRequests` / `Runs`.

## Relationship to prior work

| Surface | Today | This set |
|---------|-------|----------|
| `BulkEvidenceUploadService.SingleFile` | Writes `artifacts` blob `evidence/{runId}/{id}_{fileName}` (base64) | Catalog + download (ESI-01/02) |
| `EvidenceBulkUploadController` | `POST .../evidence/bulk` only (`ExecuteAuthority`) | Add list + get (ESI-01/02) |
| `RunDetailEvidenceInventorySection` | Filename as `<td>` text | Stored files are controls (ESI-03/04) |
| `extractAttachedIntakeFileNames` | Names scraped from generated brief | Names are not enough — catalog (ESI-01/06) |
| `buildIntakeContextDocumentsFromEvidenceFiles` | PDF/DOCX → extracted `text/plain`; images often dropped | Keep extraction; persist originals (ESI-06) |
| Create-home capture inventory | `sessionStorage` + artifact names | Server list (ESI-05) |
| `ApiFileResults` | Existing file download helper | Reuse (ESI-02) |

## Global constraints (every prompt)

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` (Linux Cloud VMs) before editing a tracked file. Exit 2 → skip and report.
- One class per file. Check nulls. Blank line before `if` / `foreach` unless first in method. Prefer LINQ and concrete types. No `ConfigureAwait(false)` in tests.
- All SQL DDL: numbered migration **and** `ArchLucid.Persistence/Scripts/ArchLucid.sql` (plus `ArchLucid_Unified_Schema.sql` if that file still mirrors it).
- HTTP: OpenAPI snapshot + `archlucid-ui` generated types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- UI: Carbon density, sentence case, visible-boundary `Button` (no ghost/link variants). Button = download; link = open/preview. `UI-Accessibility-Baseline.mdc`.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Downloaded bytes are **submitted evidence**, not the sealed review record.
- Verification: focused tests named in the prompt. Scoped compile only when C# changes: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath '…'`.
- Tenant isolation on every query and blob key (ADR 0037 Layer B/D/E). IDOR: other-tenant run id → 404.

## After each prompt

Summarize: files changed, tests run, whether citation-only rows stayed non-downloadable, whether originals vs extracted text stayed distinct, residual risk (especially intake files uploaded before ESI-06). Do not mark bulk-upload, evidence-graph, or ZIP bundle export as undone.
