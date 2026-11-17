import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createArchitectureReviewRecurrenceSchedule,
  createRiskException,
  listArchitectureReviewRecurrenceSchedules,
  listRiskExceptions,
  previewRecurrenceScheduleRuns,
  revokeRiskException,
} from "@/lib/api/governance-stickiness-api-exceptions-schedules";
import { getSponsorReport } from "@/lib/api/reports-api";

const PROXY = "http://localhost/api/proxy/v1/governance";

function installFetch(body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function requestUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return String(fetchMock.mock.calls[0]?.[0]);
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>): unknown {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;

  return JSON.parse(String(init?.body));
}

describe("governance stickiness boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drops null risk exceptions and trims the project filter", async () => {
    const fetchMock = installFetch([
      null,
      { riskExceptionId: " ex-1 ", findingId: " f-1 ", ownerUserId: " owner ", rationale: " why ", expiresAtUtc: " 2026-01-01T00:00:00Z ", status: " open " },
      { findingId: "missing-id" },
    ]);

    await expect(listRiskExceptions("  project-1  ")).resolves.toEqual([
      {
        riskExceptionId: "ex-1",
        findingId: "f-1",
        ownerUserId: "owner",
        rationale: "why",
        expiresAtUtc: "2026-01-01T00:00:00Z",
        status: "open",
        runId: null,
        manifestId: null,
        evidenceRef: null,
      },
    ]);
    expect(requestUrl(fetchMock)).toBe(`${PROXY}/risk-exceptions?projectId=project-1`);
  });

  it("trims required risk exception fields before posting", async () => {
    const fetchMock = installFetch({
      riskExceptionId: "ex-1",
      findingId: "f-1",
      ownerUserId: "owner",
      rationale: "why",
      expiresAtUtc: "2026-01-01T00:00:00Z",
      status: "open",
    });

    await createRiskException({
      findingId: " f-1 ",
      ownerUserId: " owner ",
      rationale: " why ",
      expiresAtUtc: " 2026-01-01T00:00:00Z ",
      runId: "  ",
    });

    expect(requestUrl(fetchMock)).toBe(`${PROXY}/risk-exceptions`);
    expect(requestBody(fetchMock)).toEqual({
      findingId: "f-1",
      ownerUserId: "owner",
      rationale: "why",
      expiresAtUtc: "2026-01-01T00:00:00Z",
    });
  });

  it("rejects a blank risk exception id before revoke", async () => {
    const fetchMock = installFetch({});

    await expect(revokeRiskException("   ")).rejects.toThrow("riskExceptionId is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops null recurrence schedules and trims the create body", async () => {
    const listFetch = installFetch([
      null,
      { scheduleId: " sch-1 ", sourceRunId: " run-1 ", name: " weekly ", cronExpression: " 0 0 * * 1 ", isEnabled: true },
    ]);

    await expect(listArchitectureReviewRecurrenceSchedules()).resolves.toEqual([
      expect.objectContaining({
        scheduleId: "sch-1",
        sourceRunId: "run-1",
        name: "weekly",
        cronExpression: "0 0 * * 1",
        isEnabled: true,
      }),
    ]);
    expect(requestUrl(listFetch)).toBe(`${PROXY}/recurrence-schedules`);

    const createFetch = installFetch({
      scheduleId: "sch-1",
      sourceRunId: "run-1",
      name: "weekly",
      cronExpression: "0 0 * * 1",
      isEnabled: true,
    });
    await createArchitectureReviewRecurrenceSchedule({
      sourceRunId: " run-1 ",
      name: " weekly ",
      cronExpression: " 0 0 * * 1 ",
      isEnabled: true,
    });
    expect(requestBody(createFetch)).toEqual({
      sourceRunId: "run-1",
      name: "weekly",
      cronExpression: "0 0 * * 1",
      isEnabled: true,
    });
  });

  it("rejects a negative preview count", async () => {
    const fetchMock = installFetch({});

    await expect(previewRecurrenceScheduleRuns({ cronExpression: "0 0 * * 1", count: -1 })).rejects.toThrow(
      "Preview count must be a positive number.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sponsor report boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not surface negative savings or risk counts as stored totals", async () => {
    installFetch({
      totalCostSavingsUsd: -12,
      totalRiskReductionScore: Number.NaN,
      uniqueFindingCount: -1,
      rawFindingCount: "4",
      costWasteUsd: -5,
      securityRiskCount: -2,
      reliabilityGapCount: 3,
      pendingGovernanceDecisionCount: "nope",
    });

    await expect(getSponsorReport()).resolves.toEqual({
      totalCostSavingsUsd: 0,
      totalRiskReductionScore: 0,
      uniqueFindingCount: 0,
      rawFindingCount: 4,
      costWasteUsd: null,
      securityRiskCount: 0,
      reliabilityGapCount: 3,
      pendingGovernanceDecisionCount: 0,
    });
  });
});
