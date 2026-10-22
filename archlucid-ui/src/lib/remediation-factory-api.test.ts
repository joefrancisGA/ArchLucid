import { describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";
import { fetchRemediationFactoryMetrics, fetchRemediationRankedFindings } from "@/lib/remediation-factory-api";

describe("remediation-factory-api", () => {
  it("forwards operator scope headers on ranked findings GET", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemediationRankedFindings();

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers on metrics GET", async () => {
    const tenantId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const workspaceId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    const projectId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        openFindings: 0,
        riskWeightedOpen: 0,
        criticalExposureCount: 0,
        createdThisWeek: 0,
        remediatedThisWeek: 0,
        netBurn: 0,
        recurrenceCount: 0,
        patternCoverageExactMatchPercent: 0,
        automationPercent: 0,
        verificationFailureCount: 0,
        exceptionsActive: 0,
        exceptionsExpiringSoon: 0,
        exceptionsExpired: 0,
        businessBlockedCount: 0,
        averageAgeDays: 0,
        topControlIds: [],
        topPatternKeys: [],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemediationFactoryMetrics();

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });
});
