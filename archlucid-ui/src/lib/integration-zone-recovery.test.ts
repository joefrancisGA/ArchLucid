import { describe, expect, it } from "vitest";

import {
  buildIntegrationZoneRecovery,
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";

describe("integration-zone-recovery (TB-2388)", () => {
  it("builds a three-part recovery presentation naming the failed zone and intact zones", () => {
    const zones: IntegrationZoneLoadSlice[] = [
      {
        id: "connection",
        label: "Azure Boards connection",
        failed: false,
        errorMessage: null,
      },
      {
        id: "settings",
        label: "Azure Boards settings",
        failed: true,
        errorMessage: "Database Query Failed",
      },
    ];

    const recovery = buildIntegrationZoneRecovery(zones[1], zones);

    expect(recovery?.zoneLabel).toBe("Azure Boards settings");
    expect(recovery?.presentation.whatFailed).toContain("Azure Boards settings");
    expect(recovery?.presentation.whatFailed).toContain("Database Query Failed");
    expect(recovery?.presentation.whatIsIntact).toContain("Azure Boards connection");
    expect(recovery?.presentation.nextStep).toContain("Azure Boards settings");
  });

  it("returns recoveries only for failed slices in a multi-zone load", () => {
    const zones: IntegrationZoneLoadSlice[] = [
      {
        id: "health",
        label: "Connector health",
        failed: true,
        errorMessage: "Service unavailable",
      },
      {
        id: "settings",
        label: "Outbound settings",
        failed: false,
        errorMessage: null,
      },
    ];

    const recoveries = buildIntegrationZoneRecoveries(zones);

    expect(recoveries).toHaveLength(1);
    expect(recoveries[0]?.zoneId).toBe("health");
    expect(recoveries[0]?.presentation.whatIsIntact).toContain("Outbound settings");
  });
});
