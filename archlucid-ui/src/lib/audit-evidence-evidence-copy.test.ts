import { describe, expect, it } from "vitest";

import { SECURENOW_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { auditEvidenceSourcesForProductLine } from "@/lib/audit-evidence-evidence-copy";

describe("auditEvidenceSourcesForProductLine", () => {
  it("uses the security resource inventory path on the compliance shell", () => {
    const sources = auditEvidenceSourcesForProductLine("security");
    const inventory = sources.find((source) => source.label === "Resource inventory");

    expect(inventory?.href).toBe(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH);
  });
});
