import { describe, expect, it } from "vitest";

import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { DPA_TEMPLATE_HELP_ROUTE_METADATA } from "@/lib/dpa-template-help-route-metadata";

describe("dpa-template-help-route", () => {
  it("keeps the canonical path and buyer-safe metadata", () => {
    expect(DPA_TEMPLATE_HELP_PATH).toBe("/help/dpa-template");
    expect(DPA_TEMPLATE_HELP_ROUTE_METADATA.title).toBe("Data Processing Agreement (template)");
    expect(String(DPA_TEMPLATE_HELP_ROUTE_METADATA.description ?? "").toLowerCase()).toContain(
      "not your countersigned",
    );
  });
});
