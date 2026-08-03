import { describe, expect, it } from "vitest";

import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  getProductDocumentationEntry,
  HELP_TOPIC_SLUG_ALIASES,
  normalizeHelpTopicSlug,
} from "@/lib/product-documentation-registry";

describe("evaluator-workbook help slug alias", () => {
  it("resolves evaluator-workbook to path-chooser", () => {
    expect(HELP_TOPIC_SLUG_ALIASES["evaluator-workbook"]).toBe("path-chooser");
    expect(normalizeHelpTopicSlug("evaluator-workbook")).toBe("path-chooser");
    expect(getProductDocumentationEntry("evaluator-workbook")?.slug).toBe("path-chooser");
  });

  it("loads path-chooser documentation when asked for evaluator-workbook", () => {
    const loaded = tryLoadProductDocumentation("evaluator-workbook");

    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("path-chooser");
    expect(loaded?.entry.sourcePaths).toContain("docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md");
  });
});
