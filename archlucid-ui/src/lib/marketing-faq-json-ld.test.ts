import { describe, expect, it } from "vitest";

import { MARKETING_FAQ_ITEMS } from "./marketing-faq";
import { buildFaqPageLd, serializeFaqPageLd } from "./marketing-faq-json-ld";

describe("buildFaqPageLd", () => {
  it("emits FAQPage without ratings", () => {
    const ld = buildFaqPageLd("https://archlucid.example");

    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.url).toBe("https://archlucid.example/faq");
    expect(Array.isArray(ld.mainEntity)).toBe(true);
    expect((ld.mainEntity as unknown[]).length).toBe(MARKETING_FAQ_ITEMS.length);
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("reviewCount");
  });
});

describe("serializeFaqPageLd", () => {
  it("escapes angle brackets for script injection safety", () => {
    const serialized = serializeFaqPageLd({
      "@context": "https://schema.org",
      sample: "</script><script>alert(1)</script>",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
