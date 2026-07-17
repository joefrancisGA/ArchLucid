import { join } from "node:path";

/** Build output for role-gated customer-tier help PDFs (TB-723 / TB-726). */
export function resolveCustomerHelpTopicPdfPath(slug: string): string {
  return join(process.cwd(), ".build", "docs-pdf-customer", `${slug}.pdf`);
}

/** Public help PDFs ship under `public/docs-pdf` at build time. */
export function resolvePublicHelpTopicPdfHref(slug: string): string {
  return `/docs-pdf/${encodeURIComponent(slug)}.pdf`;
}
