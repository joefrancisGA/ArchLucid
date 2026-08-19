import { describe, expect, it } from "vitest";

import {
  CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS,
  CONNECTION_STATUS_HELP_OVERVIEW,
  CONNECTION_STATUS_HELP_SURFACE_ITEMS,
} from "@/lib/connection-status-help-guide-content";
import { INTEGRATION_READINESS_SUMMARY_TILE_LABELS } from "@/lib/connector-readiness-summary";

describe("connection-status-help-guide-content", () => {
  it("names live summary-strip labels in help copy (HCO drift guard)", () => {
    const copyBlob = [
      CONNECTION_STATUS_HELP_OVERVIEW,
      ...CONNECTION_STATUS_HELP_SURFACE_ITEMS.map((item) => `${item.label} ${item.detail}`),
      ...CONNECTION_STATUS_HELP_HOW_TO_READ_STEPS,
    ].join("\n");

    for (const label of INTEGRATION_READINESS_SUMMARY_TILE_LABELS) {
      expect(copyBlob).toContain(label);
    }

    expect(copyBlob).toContain("summary strip");
    expect(copyBlob).toContain("inventory table");
    expect(copyBlob).not.toMatch(/\btiles\b/i);
  });
});
