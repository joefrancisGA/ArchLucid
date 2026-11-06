import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const FLAT_PEER_FALLBACK_PATTERN =
  /usePathname\s*\(\)\s*\?\?\s*`\/architecture\/reviews\/\$\{/;

describe("flat peer review pathname fallback guard (desk continuity)", () => {
  it("does not regress to flat peer usePathname fallback in URL-sync review actions", () => {
    const files = [
      "ExportTerraformAdvisoryButton.tsx",
      "GenerateAdrFromRunModal.tsx",
      "ReviewBoardWhitelabelConsultingExportButton.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), "src/components", file), "utf8");

      expect(FLAT_PEER_FALLBACK_PATTERN.test(source)).toBe(false);
      expect(source).toContain("resolveReviewUrlStatePathname");
    }
  });
});
