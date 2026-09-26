import { describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";
import {
  approveRemediationPatternVersion,
  fetchRemediationPatternDetail,
  fetchRemediationPatterns,
  submitRemediationPatternVersion,
} from "@/lib/remediation-pattern-api";

describe("remediation-pattern-api", () => {
  it("forwards operator scope headers on pattern list GET", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemediationPatterns();

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers on pattern detail GET and mutating POSTs", async () => {
    const tenantId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const workspaceId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    const projectId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ patternId: "pattern-1", versions: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRemediationPatternDetail("pattern-1");
    await submitRemediationPatternVersion("pattern-1", "1.0.0");
    await approveRemediationPatternVersion("pattern-1", "1.0.0");

    expect(fetchMock).toHaveBeenCalledTimes(3);

    for (const call of fetchMock.mock.calls) {
      const headers = new Headers((call[1] as RequestInit | undefined)?.headers);
      expect(headers.get("x-tenant-id")).toBe(tenantId);
      expect(headers.get("x-workspace-id")).toBe(workspaceId);
      expect(headers.get("x-project-id")).toBe(projectId);
    }

    vi.unstubAllGlobals();
  });
});
