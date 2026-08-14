import { describe, expect, it } from "vitest";

import { HELP_OPERATOR_PAGE_TITLE_PARITY_SURFACES } from "@/lib/help/help-operator-page-title-parity-contract";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("help operator page title parity", () => {
  it.each(HELP_OPERATOR_PAGE_TITLE_PARITY_SURFACES)(
    "$slug help H1 matches operator page title",
    (surface) => {
      expect(surface.helpPageTitle).toBe(surface.operatorPageTitle);

      const entry = getProductDocumentationEntry(surface.slug);

      expect(entry, `missing registry entry for ${surface.slug}`).not.toBeNull();
      expect(entry?.title).toBe(surface.operatorPageTitle);
    },
  );
});
