# ESI-03 — Review Evidence inventory: open + download on stored files only

**Depends on ESI-01 and ESI-02.** **Do not fork** sealed-record artifact preview (`artifactPreviewHref`).

## Goal

On the review Evidence tab, **stored files** are inspectable:

- **Source name** is a **link** that opens/previews (ESI-04 may replace the target; until 04 lands, the link may trigger download via the GET — prefer wiring a named handler so 04 can switch to preview without a second table rewrite).
- A separate **Download** **button** (`outline` or equivalent visible-boundary variant) always downloads (`Content-Disposition: attachment`).
- `architecture-brief` and `citation` rows stay **plain text**. Optional helper: “Cited — original not stored” / “Architecture brief” — do **not** style them as links.

Accessibility: link vs button per `UI-Accessibility-Baseline.mdc`. Keyboard reachable. Accessible name includes the file name (`Download network-topology.png`).

## Why

Dead filenames are the owner-visible gap. Making every row clickable would advertise downloads for snippet-derived names (`storageAccount.bicep:42`) that were never uploaded.

## Context

- `archlucid-ui/src/components/runs/RunDetailEvidenceInventorySection.tsx`
- `archlucid-ui/src/lib/runs/run-detail-evidence-inventory.ts` (kinds from ESI-01)
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-presentation-evidence.ts`
- Carbon `EnterpriseTable`; sentence case; `OPERATOR_TYPOGRAPHY`
- Existing download helpers in `archlucid-ui/src/lib` (blob + anchor `download` attribute) — reuse rather than invent a second downloader

## What to build

1. Pass catalog id + kind into the table row DTO (no blob URIs in the client model).
2. Stored-file cells: `<a>` (open) + `<Button>` (download). Do not make the whole `<tr>` clickable.
3. Citation / brief: unchanged text; no `href`.
4. Error: missing file (404) → inline recovery / `showError` toast for **async** failure only (TB-2005). Do not toast “this row is a citation.”
5. Vitest: stored-file row has link + download button; citation row has neither; brief row has neither. Prefer `data-testid` on the download control (`run-detail-evidence-download-{id}`).

## Acceptance criteria

- Screenshot-level: an uploaded `ARCHITECTURE_HANDBOOK.docx` is a control; a finding citation that is not in the catalog is not.
- Desktop review tabs unchanged (no **More** menu).
- Create-home table is **out of scope** (ESI-05).

## Constraints

- No ghost/link `Button` variants.
- Do not collapse workspace tabs.
- Do not call the control “Export sealed review record.”
- Do not implement the image lightbox here if it is more than a download (ESI-04).
