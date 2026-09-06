import { describe, expect, it } from "vitest";

import {
  applyInfraResourcesSavedViewFilters,
  buildInfraResourcesSavedViewPayload,
} from "@/lib/infra-evidence/infra-evidence-explorer-saved-view-helpers";

describe("infra-evidence-explorer-saved-view-helpers", () => {
  it("round-trips explorer filters in saved view payloads", () => {
    const payload = buildInfraResourcesSavedViewPayload({
      namePrefix: "gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      workQueue: "open-findings",
    });

    const applied = applyInfraResourcesSavedViewFilters(payload.filters as {
      namePrefix?: string;
      resourceType?: string;
      resourceGroup?: string;
      workQueue?: string;
    });

    expect(applied).toEqual({
      namePrefix: "gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      workQueue: "open-findings",
    });
  });
});
