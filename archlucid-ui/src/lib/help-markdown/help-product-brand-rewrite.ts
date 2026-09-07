import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

/**
 * Lines that name ArchLucid as the company, legal entity, or protocol identifier — not the product.
 * Security help keeps these tokens while consumer product mentions rewrite to SecureNow.
 */
const HELP_BRAND_COMPANY_LINE_PATTERNS: readonly RegExp[] = [
  /archlucid\.net/i,
  /security@archlucid/i,
  /\bsubprocessors\b/i,
  /hosted ArchLucid SaaS/i,
  /ArchLucid-hosted/i,
  /if ArchLucid ceases/i,
  /ArchLucidAuth/i,
  /ArchLucid\.Api/i,
  /Get-ArchLucid/i,
  /ArchLucid uses the following/i,
  /Core hosted ArchLucid API/i,
  /contracting entity/i,
  /order form or security/i,
] as const;

function shouldSkipHelpBrandRewriteLine(line: string): boolean {
  return HELP_BRAND_COMPANY_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Rewrites architecture product name in presented help markdown for the Security product line.
 * Skips company/legal/protocol lines and respects `{…}` script placeholders via {@link localizeProductCopy}.
 */
export function applyHelpProductBrandRewrite(
  markdown: string,
  productLineId: ProductLineId = "architecture",
): string {
  if (productLineId === "architecture") {
    return markdown;
  }

  let inFence = false;
  const lines = markdown.split("\n");

  return lines
    .map((line) => {
      const trimmedStart = line.trimStart();

      if (trimmedStart.startsWith("```")) {
        inFence = !inFence;

        return line;
      }

      if (inFence || shouldSkipHelpBrandRewriteLine(line)) {
        return line;
      }

      return localizeProductCopy(productLineId, line);
    })
    .join("\n");
}
