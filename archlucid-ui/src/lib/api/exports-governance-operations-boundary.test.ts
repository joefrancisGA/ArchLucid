import { afterEach, describe, expect, it, vi } from "vitest";

import { saveExecDigestPreferences } from "@/lib/api/advisory-digests-read-export";
import { acknowledgeAlertsBatch } from "@/lib/api/alerts-inbox-api";
import { askArchLucid } from "@/lib/api/conversation-api";
import { downloadBoardPackPdf } from "@/lib/api/downloads-blob-trigger-reports";
import { getArchitecturePackageDocxUrl } from "@/lib/api/downloads-blob-urls";
import {
  heartbeatDraftWorkLease,
} from "@/lib/api/draft-intake-api-work-lease";
import { getExportRecordComparisonHistory } from "@/lib/api/export-record-comparison-api";
import { getOperation } from "@/lib/api/operations-api";
import { dryRunPolicyPack } from "@/lib/api/policy-packs-api-mutate";
import { getRunComparisonHistory } from "@/lib/api/run-comparison-history-api";

function installFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
    status,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("exports governance operations boundary", () => {
  it("rejects blank operation ids before GET", async () => {
    const fetchMock = installFetch({});

    await expect(getOperation("   ")).rejects.toThrow("operationId is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-object operation responses", async () => {
    const fetchMock = installFetch([]);

    await expect(getOperation("op-1")).rejects.toThrow("Operation response was not recognized.");
    expect(requestUrl(fetchMock)).toContain("/v1/operations/op-1");
  });

  it("rejects blank export record and run ids for comparison history", async () => {
    const fetchMock = installFetch({ items: [] });

    await expect(getExportRecordComparisonHistory("  ")).rejects.toThrow("exportRecordId is required.");
    await expect(getRunComparisonHistory("  ")).rejects.toThrow("runId is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects blank ask questions and trims run ids in the POST body", async () => {
    const fetchMock = installFetch({ answer: "ok", comparisonNarrative: null, citations: [] });

    await expect(askArchLucid({ question: "   ", runId: " run-1 " })).rejects.toThrow("question is required.");

    await askArchLucid({ question: "  why?  ", runId: " run-1 " });
    expect(requestBody(fetchMock)).toMatchObject({ question: "why?", runId: "run-1" });
  });

  it("rejects batch acknowledge when every alert id is blank", async () => {
    const fetchMock = installFetch({ results: [] });

    await expect(acknowledgeAlertsBatch(["  ", ""])).rejects.toThrow("alertIds is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates board pack year and quarter before POST", async () => {
    const fetchMock = installFetch({});

    await expect(downloadBoardPackPdf(0, 1)).rejects.toThrow("year must be a positive integer.");
    await expect(downloadBoardPackPdf(2026, 5)).rejects.toThrow("quarter must be between 1 and 4.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("encodes run id segments in architecture package docx URLs", () => {
    expect(getArchitecturePackageDocxUrl(" run/a ")).toBe(
      "/api/proxy/v1/docx/runs/run%2Fa/architecture-package",
    );
  });

  it("rejects blank policy pack id for dry-run and trims evaluateAgainstRunIds", async () => {
    const fetchMock = installFetch({
      policyPackId: "pack-1",
      evaluatedUtc: "2026-01-01T00:00:00Z",
      page: 1,
      pageSize: 20,
      returnedRuns: 0,
      totalRequestedRuns: 0,
      proposedThresholdsRedactedJson: "{}",
      deltaCounts: { evaluated: 0, runMissing: 0, wouldAllow: 0, wouldBlock: 0 },
      items: [null, { runId: "run-1" }],
    });

    await expect(
      dryRunPolicyPack("  ", { evaluateAgainstRunIds: ["  run-1 ", "  ", "run-2"] }),
    ).rejects.toThrow("policyPackId is required.");

    await dryRunPolicyPack("pack-1", { evaluateAgainstRunIds: ["  run-1 ", "  ", "run-2"] });
    expect(requestUrl(fetchMock)).toContain("/policy-packs/pack-1/dry-run");
    expect(requestBody(fetchMock)).toEqual({ evaluateAgainstRunIds: ["run-1", "run-2"] });
  });

  it("validates exec digest scheduling fields before POST", async () => {
    const fetchMock = installFetch({
      schemaVersion: 1,
      tenantId: "t-1",
      isConfigured: true,
      emailEnabled: true,
      recipientEmails: [],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 9,
      updatedUtc: "2026-01-01T00:00:00Z",
    });

    await expect(
      saveExecDigestPreferences({
        emailEnabled: true,
        recipientEmails: ["  a@b.com  "],
        ianaTimeZoneId: "  UTC  ",
        dayOfWeek: 9,
        hourOfDay: 9,
      }),
    ).rejects.toThrow("dayOfWeek must be between 0 and 6.");

    await saveExecDigestPreferences({
      emailEnabled: true,
      recipientEmails: ["  a@b.com  "],
      ianaTimeZoneId: "  UTC  ",
      dayOfWeek: 1,
      hourOfDay: 9,
    });
    expect(requestBody(fetchMock)).toEqual({
      emailEnabled: true,
      recipientEmails: ["a@b.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 9,
    });
  });

  it("rejects malformed work-lease heartbeat bodies", async () => {
    const fetchMock = installFetch("", 200);

    await expect(heartbeatDraftWorkLease("draft-1")).rejects.toThrow("Work lease response was not recognized.");
    expect(requestUrl(fetchMock)).toContain("/work-lease/heartbeat");
  });
});