/** Public help PDFs ship under `public/docs-pdf` at build time. */
export function resolvePublicHelpTopicPdfHref(slug: string): string {
  return `/docs-pdf/${encodeURIComponent(slug)}.pdf`;
}
