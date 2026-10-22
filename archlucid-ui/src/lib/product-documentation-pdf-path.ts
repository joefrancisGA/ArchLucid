import "server-only";

import { join } from "node:path";

/** Build output for role-gated customer-tier help PDFs (TB-723 / TB-726). */
export function resolveCustomerHelpTopicPdfPath(slug: string): string {
  return join(process.cwd(), ".build", "docs-pdf-customer", `${slug}.pdf`);
}
