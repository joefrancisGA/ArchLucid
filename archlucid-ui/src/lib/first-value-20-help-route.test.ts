import { describe, expect, it } from "vitest";

import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { FIRST_VALUE_20_HELP_ROUTE_METADATA } from "@/lib/first-value-20-help-route-metadata";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";

describe("first-value-20-help-route", () => {
  it("keeps the canonical folded COR anchor and runbook-safe metadata", () => {
    expect(FIRST_VALUE_20_HELP_PATH).toBe("/help/first-architecture-review#first-value-in-20-minutes");
    expect(FIRST_VALUE_20_HELP_ROUTE_METADATA.title).toBe("First value in 20 minutes (Admin runbook)");
    expect(String(FIRST_VALUE_20_HELP_ROUTE_METADATA.description ?? "").toLowerCase()).toContain(
      "not the default customer",
    );
  });

  it("does not redirect the retired first-value-20-minutes slug", () => {
    expect(resolveHelpTopicPermanentRedirect("first-value-20-minutes")).toBeNull();
  });
});
