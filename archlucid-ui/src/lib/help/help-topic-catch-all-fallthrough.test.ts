import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertHelpTopicCatchAllFallthroughAllowed,
  HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS,
  HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS,
  resolveHelpTopicCatchAllDispatchKind,
} from "@/lib/help/help-topic-catch-all-fallthrough";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";

const HELP_TOPIC_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

describe("help-topic-catch-all-fallthrough TB-1601", () => {
  it("maps every non-runbook registry slug to specialty or enriched dispatch", () => {
    for (const entry of listProductDocumentationEntries()) {
      if (entry.contentKind === "internal-runbook") {
        continue;
      }

      expect(
        resolveHelpTopicCatchAllDispatchKind(entry),
        `missing dispatch for ${entry.slug}`,
      ).not.toBeNull();

      if (resolveHelpTopicCatchAllDispatchKind(entry) === "bare-markdown-allowlisted") {
        expect(() => assertHelpTopicCatchAllFallthroughAllowed(entry)).not.toThrow();
      } else {
        expect(() => assertHelpTopicCatchAllFallthroughAllowed(entry)).toThrow(/TB-1601/);
      }
    }
  });

  it("rejects product-help slugs that would hit bare markdown fallthrough", () => {
    expect(() =>
      assertHelpTopicCatchAllFallthroughAllowed({
        slug: "choose-your-next-step",
        contentKind: "product-help",
      }),
    ).toThrow(/TB-1601/);

    expect(() =>
      assertHelpTopicCatchAllFallthroughAllowed({
        slug: "new-unregistered-product-help",
        contentKind: "product-help",
      }),
    ).toThrow(/TB-1601/);
  });

  it("wires choose-your-next-step through specialty dispatch inventory", () => {
    expect(HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS).toContain("choose-your-next-step");
  });

  it("keeps enriched markdown slugs out of bare default fallthrough", () => {
    for (const slug of HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS) {
      expect(HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS).not.toContain(slug);
    }
  });

  it("guards renderHelpTopicView default fallthrough in page.tsx", () => {
    const source = readFileSync(HELP_TOPIC_PAGE_PATH, "utf8");

    expect(source).toContain("assertHelpTopicCatchAllFallthroughAllowed");
    expect(source).toContain("choose-your-next-step");
    expect(source).toContain("HelpPathChooserGuideView");
  });
});
