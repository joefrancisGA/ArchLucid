import { describe, expect, it } from "vitest";

import {
  buildAlertsInboxCanonicalHref,
  shouldCanonicalizeAlertsInboxTabParam,
} from "@/lib/alerts-hub-tab";

describe("alerts-hub-tab", () => {
  it("canonicalizes legacy tab=inbox to /governance/alerts", () => {
    expect(shouldCanonicalizeAlertsInboxTabParam("inbox")).toBe(true);
    expect(shouldCanonicalizeAlertsInboxTabParam("rules")).toBe(false);
    expect(buildAlertsInboxCanonicalHref({})).toBe("/governance/alerts");
    expect(buildAlertsInboxCanonicalHref({ status: "Open", page: "2" })).toBe(
      "/governance/alerts?status=Open&page=2",
    );
  });
});
