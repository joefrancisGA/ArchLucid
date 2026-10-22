import { describe, expect, it } from "vitest";

import { buildMarketingSoftwareApplicationLd } from "./marketing-json-ld";

describe("buildMarketingSoftwareApplicationLd", () => {
  it("emits SoftwareApplication JSON-LD without review aggregates", () => {
    const ld = buildMarketingSoftwareApplicationLd("https://archlucid.example");

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("ArchLucid");
    expect(ld.url).toBe("https://archlucid.example");
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.reviewCount).toBeUndefined();

    const publisher = ld.publisher as Record<string, unknown> | undefined;

    expect(publisher?.["@type"]).toBe("Organization");
    expect(publisher?.url).toBe("https://archlucid.example");
  });

  it("strips a trailing slash from origin", () => {
    const ld = buildMarketingSoftwareApplicationLd("https://archlucid.example/");

    expect(ld.url).toBe("https://archlucid.example");
    expect((ld.publisher as Record<string, unknown>).url).toBe("https://archlucid.example");
  });
});
