import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { hrefTargetsPermanentRedirectSource } from "@/lib/next-config-permanent-redirect-source-paths";

export type ProductLinkRedirectGuardViolation = {
  readonly relativePath: string;
  readonly href: string;
  readonly line: number;
};

/** Product surfaces scanned for in-app hrefs that target legacy redirect sources (IA-012). */
export const PRODUCT_LINK_REDIRECT_GUARD_SCAN_ROOTS = [
  "src/app/(operator)",
  "src/components",
] as const;

const PRODUCT_LINK_REDIRECT_GUARD_EXCLUDED_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"] as const;

const PRODUCT_LINK_HREF_PATTERN =
  /(?:href|url)\s*[:=]\s*["'`](\/[^"'`?#]+[^"'`]*)["'`]/g;

function shouldScanProductLinkSource(relativePath: string): boolean {
  if (!relativePath.endsWith(".ts") && !relativePath.endsWith(".tsx")) {
    return false;
  }

  return !PRODUCT_LINK_REDIRECT_GUARD_EXCLUDED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));
}

function listProductLinkSourceFiles(rootRelativePath: string): string[] {
  const absoluteRoot = join(process.cwd(), rootRelativePath);

  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const files: string[] = [];

  function walk(currentRelative: string): void {
    const absoluteCurrent = join(process.cwd(), currentRelative);

    for (const entry of readdirSync(absoluteCurrent)) {
      const entryRelative = join(currentRelative, entry).replace(/\\/g, "/");
      const absoluteEntry = join(absoluteCurrent, entry);
      const stats = statSync(absoluteEntry);

      if (stats.isDirectory()) {
        walk(entryRelative);
        continue;
      }

      if (shouldScanProductLinkSource(entryRelative)) {
        files.push(entryRelative);
      }
    }
  }

  walk(rootRelativePath);

  return files.sort((a, b) => a.localeCompare(b));
}

/** Collect product-generated hrefs that still target `next.config` permanent redirect sources. */
export function findProductLinksTargetingRedirectSources(): ProductLinkRedirectGuardViolation[] {
  const violations: ProductLinkRedirectGuardViolation[] = [];

  for (const root of PRODUCT_LINK_REDIRECT_GUARD_SCAN_ROOTS) {
    for (const relativePath of listProductLinkSourceFiles(root)) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");
      const lines = source.split(/\r?\n/);

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? "";
        const pattern = new RegExp(PRODUCT_LINK_HREF_PATTERN.source, "g");
        let match: RegExpExecArray | null = pattern.exec(line);

        while (match !== null) {
          const href = match[1] ?? "";

          if (href.length > 0 && hrefTargetsPermanentRedirectSource(href)) {
            violations.push({
              relativePath,
              href,
              line: index + 1,
            });
          }

          match = pattern.exec(line);
        }
      }
    }
  }

  return violations;
}
