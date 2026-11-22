import { afterEach, describe, expect, it, vi } from "vitest";

import { getGovernancePosture } from "./governance-stickiness-api-registers";

const POSTURE_RESPONSE = {
  pillars: [],
  reviewIntegrity: {
    criticalCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    dispositionedCount: 0,
    mutedCount: 0,
  },
  uncategorizedCount: 0,
  primaryPillarKey: null,
  latestSnapshotCreatedUtc: null,
  isDegraded: false,
};

function installFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(POSTURE_RESPONSE), {
    status: 200,
    headers: { "content-type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("governance-stickiness-api-registers", () => {
  it("trims the governance posture project scope before sending it", async () => {
    const fetchMock = installFetch();

    await getGovernancePosture("  project-1  ");

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://localhost/api/proxy/v1/governance/posture?projectId=project-1",
    );
  });

  it("omits a blank governance posture project scope", async () => {
    const fetchMock = installFetch();

    await getGovernancePosture("   ");

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://localhost/api/proxy/v1/governance/posture",
    );
  });
});
