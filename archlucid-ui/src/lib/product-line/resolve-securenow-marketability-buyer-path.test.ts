import { describe, expect, it } from "vitest";

import { resolveSecureNowMarketabilityBuyerPath } from "@/lib/product-line/resolve-securenow-marketability-buyer-path";

describe("resolve-securenow-marketability-buyer-path", () => {
  it("cross-links public pages and quote packet with NO_GO honesty", () => {
    const buyerPath = resolveSecureNowMarketabilityBuyerPath();
    expect(buyerPath.lead).toContain("NO_GO");
    expect(buyerPath.snEvalQuoteLine).toContain("signed quote");
    expect(buyerPath.links.map((link) => link.href)).toEqual([
      "/why-securenow",
      "/securenow-sample",
      "/administration/securenow-quote-packet",
    ]);
  });
});
