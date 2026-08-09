/** Customer-facing copy for the public `/see-it` marketing page (TB-1280). */

/** Primary H1 — must not overclaim a 30-second micro-demo (TB-1280). */
export const SEE_IT_PAGE_TITLE = "See a finalized sample review";

export const SEE_IT_PAGE_METADATA_TITLE = `ArchLucid · ${SEE_IT_PAGE_TITLE}`;

/** Marketing PDF on `/see-it` — not a governed evidence export (TB-1283). */
export const SEE_IT_MARKETING_PDF_HREF = "/api/proxy/v1/marketing/why-archlucid-pack.pdf" as const;

export const SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME = "why-archlucid-pack.pdf";

export const SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL = "Download sample overview (PDF)";

export const SEE_IT_MARKETING_PDF_HELPER =
  "The PDF is a no-sign-in marketing overview aligned with this sample — not the full governed evidence bundle from a signed-in workspace.";
