> **Scope:** Copy-paste Composer/Cloud Agent prompts so reviewers can **inspect original submitted files** on the review screen (preview first, Download second). Internal engineering only — not buyer-facing copy.
> **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/evidence-source-inspect-00-index.md`](../../.cursor/prompts/evidence-source-inspect-00-index.md) (**ESI-01–ESI-08**)
> **Do not fork:** sealed-record artifact preview; evidence graph; ZIP package export; desktop review tab collapse; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**

# Evidence source inspect — Composer prompts (ESI-01–ESI-08)

**Created:** 2026-09-07 · **Status:** ready to run · **Audience:** Cursor Composer implementing review-screen open/download of attached documents, pictures, and text files.

**Product framing (locked unless the owner reopens it in that session):**

| Do | Do not |
|----|--------|
| Open the **original** submitted file from the review Evidence table | Treat every inventory row as a file |
| **Preview** images/text/PDF in-app when safe | Force download as the only way to see a PNG |
| Separate **Download** button | Clickable citation names that were never stored |
| Persist intake originals into the same catalog as bulk upload | Send PDF bytes into `text/plain` ingestion |
| Call bytes **submitted evidence** | Call a source file the **sealed review record** |

Today the Evidence tab (`RunDetailEvidenceInventorySection`) and create-home capture table render file names as dead text. Bulk upload already writes blobs; intake often keeps only extracted text and a name list in the brief. `IArtifactBlobStore` cannot list containers — a SQL catalog is required.

Paste **one** `.cursor/prompts/evidence-source-inspect-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

## Diagnosis → prompt

| Class | Prompt | Residual |
|-------|--------|----------|
| Names without durable ids | **ESI-01** | No list API; sessionStorage / brief names |
| Bytes in blob, no GET | **ESI-02** | POST bulk only |
| Dead text on review Evidence | **ESI-03** | Stored files not controls |
| Download-as-default | **ESI-04** | Pictures/text should preview |
| Create-home list dies with the tab | **ESI-05** | `sessionStorage` SoT |
| Wizard discards originals | **ESI-06** | PDF/DOCX extract-only; images dropped |
| False seal / IDOR | **ESI-07** | Read vs execute; honesty copy |
| Help and CI | **ESI-08** | Intake help silent; no ratchet |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **ESI-01** Catalog | **First** | Existing bulk blob write |
| **ESI-02** Download/stream API | After 01 | Catalog ids |
| **ESI-03** Review table controls | After 02 | Row kinds from 01 |
| **ESI-04** Preview | After 02/03 | Inline GET |
| **ESI-05** Create-home list | After 01; can parallel 03 | Catalog GET |
| **ESI-06** Intake original retention | After 01 | Same upload/catalog path |
| **ESI-07** Authz + seal honesty | After 02 | GET policy |
| **ESI-08** Help / a11y / ratchet | Last | 03–05 affordances |

## Intentional — do not “fix”

- Desktop review workspace tabs (no **More** menu).
- Sealed package ZIP / Markdown / consulting DOCX exports (different objects).
- Evidence graph route naming (TB-2097).
- Context ingestion MIME allowlist (`text/plain`, `text/markdown` only).
- Converting `IArtifactBlobStore` from UTF-8 strings to a binary port (bulk upload already stores **base64**).
- Historical blobs uploaded before the catalog — honesty as “original not stored,” not a silent 404 link.
- SQL RLS (ADR 0037).

## Global constraints

See [`.cursor/prompts/evidence-source-inspect-00-index.md`](../../.cursor/prompts/evidence-source-inspect-00-index.md). Working-tree checks; unified SQL DDL; OpenAPI when the wire changes; Carbon + accessibility baseline; TB-645 vocabulary; focused tests; scoped compile only for C#.
