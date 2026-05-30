import { describe, expect, it } from "vitest";

import {
  getProductDocumentationEntry,
  inAppHelpHref,
  listProductDocumentationEntries,
} from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("product-documentation-registry", () => {
  it("maps canonical slugs to in-app routes", () => {
    expect(inAppHelpHref("pilot-guide")).toBe("/help/pilot-guide");
    expect(getProductDocumentationEntry("troubleshooting")?.title).toBe("Troubleshooting");
  });

  it("loads markdown for every registry topic from the monorepo", () => {
    for (const entry of listProductDocumentationEntries()) {
      const loaded = tryLoadProductDocumentation(entry.slug);

      expect(loaded, `missing markdown for ${entry.slug}`).not.toBeNull();
      expect(loaded!.markdown.trim().length).toBeGreaterThan(40);
    }
  });
});
