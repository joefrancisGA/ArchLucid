import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { RETIRED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_PATH } from "@/lib/ui-route-traffic-retired-help-topic-aliases";
import { AZURE_BOARDS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-azure-boards-help";

const HELP_CATCH_ALL_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

const BUYER_HELP_DEEP_LINK_SURFACES = [
  "src/lib/azure-boards-help-evidence-copy.ts",
  "src/lib/help-search-panel-catalog.ts",
  "src/lib/configuration-reference-help-guide-content.ts",
] as const;

describe("azure-boards help alias honesty (TB-1704)", () => {
  it("permanently redirects nested integrations/azure-boards bookmarks before render", () => {
    expect(resolveHelpTopicPermanentRedirect("integrations/azure-boards")).toBe(
      AZURE_BOARDS_HELP_TRAFFIC_PATH,
    );
    expect(inAppHelpHref("integrations/azure-boards")).toBe(AZURE_BOARDS_HELP_TRAFFIC_PATH);

    const pageSource = readFileSync(HELP_CATCH_ALL_PAGE_PATH, "utf8");
    const permanentRedirectIndex = pageSource.indexOf("resolveHelpTopicPermanentRedirect");
    const entryLookupIndex = pageSource.indexOf("getProductDocumentationEntry(slug)");

    expect(permanentRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(entryLookupIndex).toBeGreaterThan(permanentRedirectIndex);
    expect(pageSource).toContain("permanentRedirect(permanentRedirectTarget)");
  });

  it.each(BUYER_HELP_DEEP_LINK_SURFACES)(
    "keeps %s free of nested integrations/azure-boards help deep links",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source, `${relativePath} must not deep-link ${RETIRED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_PATH}`).not.toContain(
        RETIRED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_PATH,
      );
    },
  );
});
