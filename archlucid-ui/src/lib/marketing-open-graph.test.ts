import { describe, expect, it } from "vitest";

import {
  MARKETING_PRICING_OG_DESCRIPTION,
  MARKETING_ROOT_OG_DESCRIPTION,
  MARKETING_WELCOME_OG_DESCRIPTION,
  buildMarketingOpenGraph,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";

describe("marketing-open-graph", () => {
  it("uses buyer-facing root copy without operator jargon", () => {
    expect(MARKETING_ROOT_OG_DESCRIPTION).toContain("Defensible architecture, on demand");
    expect(MARKETING_ROOT_OG_DESCRIPTION.toLowerCase()).not.toContain("operator ui");
  });

  it("builds openGraph with raster preview image", () => {
    const og = buildMarketingOpenGraph("ArchLucid", MARKETING_WELCOME_OG_DESCRIPTION, "/welcome");

    expect(og?.images?.[0]).toMatchObject({
      width: 1200,
      height: 630,
    });
    expect(String(og?.images?.[0]?.url ?? "")).toContain("/logo/og-default.png");
  });

  it("welcome and pricing social metadata exclude Operator UI", () => {
    const welcome = buildMarketingSocialMetadata(
      "Welcome",
      MARKETING_WELCOME_OG_DESCRIPTION,
      "/welcome",
    );
    const pricing = buildMarketingSocialMetadata(
      "Pricing",
      MARKETING_PRICING_OG_DESCRIPTION,
      "/pricing",
    );

    expect(welcome.openGraph?.description).toBe(MARKETING_WELCOME_OG_DESCRIPTION);
    expect(pricing.openGraph?.description).toBe(MARKETING_PRICING_OG_DESCRIPTION);
    expect(String(welcome.openGraph?.description)).not.toContain("Operator UI");
    expect(String(pricing.openGraph?.description)).not.toContain("Operator UI");
  });
});
