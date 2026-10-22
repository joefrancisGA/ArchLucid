import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  MARKETING_FAQ_DILIGENCE_SECONDARY_CTAS,
  MARKETING_FAQ_NDA_REQUEST_HREF,
} from "@/lib/marketing/marketing-faq-page-copy";

const marketingAppRoot = join(process.cwd(), "src/app/(marketing)");

function walkMarketingFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walkMarketingFiles(fullPath, files);
      continue;
    }

    if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("marketing copy honesty (TB-2333)", () => {
  it("bans buyer-visible sponsor sponsor under app/(marketing)", () => {
    const files = walkMarketingFiles(marketingAppRoot);
    const offenders: string[] = [];

    for (const filePath of files) {
      const text = readFileSync(filePath, "utf8");

      if (/sponsor sponsor/i.test(text)) {
        offenders.push(filePath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("points anonymous FAQ NDA CTA at public Trust Center", () => {
    const ndaCta = MARKETING_FAQ_DILIGENCE_SECONDARY_CTAS.find(
      (cta) => cta.testId === "marketing-faq-diligence-nda-request",
    );

    expect(ndaCta).toBeDefined();
    expect(ndaCta?.href).toBe(MARKETING_FAQ_NDA_REQUEST_HREF);
    expect(ndaCta?.href).toBe("/trust");
    expect(ndaCta?.href).not.toContain("/administration/");
  });
});
