import { describe, expect, it } from "vitest";

import {
  resolvePolicyPacksEffectiveLayersHelper,
  resolvePolicyPacksWorkspaceAssignmentsEmptyLine,
} from "@/lib/policy/policy-packs-workspace-status-copy";

describe("policy-packs-workspace-status-copy", () => {
  it("reconciles empty assignments when inventory exists", () => {
    expect(resolvePolicyPacksWorkspaceAssignmentsEmptyLine(2)).toMatch(/Registered packs/i);
    expect(resolvePolicyPacksEffectiveLayersHelper({
      effectiveLayerCount: 2,
      registeredPackCount: 2,
      workspaceAssignmentCount: 0,
    })).toMatch(/assignment list empty/i);
  });
});
