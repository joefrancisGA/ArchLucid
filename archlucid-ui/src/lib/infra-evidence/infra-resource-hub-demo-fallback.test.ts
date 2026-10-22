import { describe, expect, it } from "vitest";

import {
  tryWorkbookInfraResourceHubDemoFallback,
  WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID,
} from "@/lib/infra-evidence/infra-resource-hub-demo-fallback";

describe("infra-resource-hub-demo-fallback", () => {
  it("returns curated hub payload for workbook fixture id", () => {
    const hub = tryWorkbookInfraResourceHubDemoFallback(WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID);

    expect(hub).not.toBeNull();
    expect(hub?.operationalSecurityFindings.items).toHaveLength(1);
    expect(hub?.auditLineageLink.available).toBe(true);
  });

  it("returns null for unrelated ids", () => {
    expect(tryWorkbookInfraResourceHubDemoFallback("other")).toBeNull();
  });
});
