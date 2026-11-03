import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isSecureNowInvestigationEffortAuditCandidate,
  isSecureNowInvestigationEffortFixtureWorksheet,
  persistSecureNowInvestigationEffortInputs,
  readSecureNowInvestigationEffortInputs,
  secureNowInvestigationEffortInputStorageKeyForScope,
} from "./securenow-investigation-effort-input-storage";

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-a",
    workspaceId: "workspace-b",
    projectId: "project-c",
    workspaceLabel: "Working",
    projectLabel: "Default",
  }),
}));

describe("securenow-investigation-effort-input-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and restores inputs per tenant workspace scope", () => {
    persistSecureNowInvestigationEffortInputs({
      baselineHours: "4",
      afterHours: "2",
      annualInvestigations: "12",
      hourlyRate: "90",
      annualCost: "8000",
    });

    const key = secureNowInvestigationEffortInputStorageKeyForScope("tenant-a", "workspace-b");
    expect(window.localStorage.getItem(key)).toContain('"baselineHours":"4"');

    expect(readSecureNowInvestigationEffortInputs()).toEqual({
      baselineHours: "4",
      afterHours: "2",
      annualInvestigations: "12",
      hourlyRate: "90",
      annualCost: "8000",
    });
  });

  it("treats the fixture worksheet as ineligible for audit storage", () => {
    const fixture = {
      baselineHours: "3",
      afterHours: "2",
      annualInvestigations: "20",
      hourlyRate: "100",
      annualCost: "10000",
    };

    expect(isSecureNowInvestigationEffortFixtureWorksheet(fixture)).toBe(true);
    expect(isSecureNowInvestigationEffortAuditCandidate(fixture)).toBe(false);
    expect(isSecureNowInvestigationEffortAuditCandidate({
      baselineHours: "5",
      afterHours: "3",
      annualInvestigations: "10",
      hourlyRate: "80",
      annualCost: "5000",
    })).toBe(true);
  });
});
