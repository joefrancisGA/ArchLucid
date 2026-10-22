import { describe, expect, it } from "vitest";

import { isAllowedPageHelpTopicSlug } from "@/lib/help/help-topic-identity";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";
import { listPageHelpTopicSlugs } from "@/lib/usability/page-help-topic-rows";

describe("page-help topic slug drift", () => {
  it("keeps every mapped slug in the customer registry or the documented map-only set", () => {
    const registrySlugs = new Set(listProductDocumentationEntries().map((entry) => entry.slug));
    const mappedSlugs = listPageHelpTopicSlugs();

    expect(mappedSlugs.length).toBeGreaterThan(0);

    const unknown = mappedSlugs.filter((slug) => !isAllowedPageHelpTopicSlug(slug, registrySlugs));

    expect(unknown).toEqual([]);
  });
});
