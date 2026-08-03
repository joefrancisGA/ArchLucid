import { describe, expect, it } from "vitest";

import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { FIRST_VALUE_20_HELP_ROUTE_METADATA } from "@/lib/first-value-20-help-route-metadata";

describe("first-value-20-help-route", () => {
  it("keeps the canonical Admin path and runbook-safe metadata", () => {
    expect(FIRST_VALUE_20_HELP_PATH).toBe("/help/first-value-20-minutes");
    expect(FIRST_VALUE_20_HELP_ROUTE_METADATA.title).toBe("First value in 20 minutes (Admin runbook)");
    expect(String(FIRST_VALUE_20_HELP_ROUTE_METADATA.description ?? "").toLowerCase()).toContain(
      "not the default customer",
    );
  });
});
