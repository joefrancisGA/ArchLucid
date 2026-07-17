import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";

import { resolveCustomerHelpTopicPdfPath } from "@/lib/product-documentation-pdf-path";

export async function readCustomerHelpTopicPdf(
  slug: string,
): Promise<{ bytes: Buffer; size: number } | null> {
  const pdfPath = resolveCustomerHelpTopicPdfPath(slug);

  if (!existsSync(pdfPath)) {
    return null;
  }

  const [bytes, pdfStat] = await Promise.all([readFile(pdfPath), stat(pdfPath)]);

  return { bytes, size: pdfStat.size };
}
