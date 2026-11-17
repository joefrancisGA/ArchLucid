import { afterEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.hoisted(() => vi.fn());
const apiPostJson = vi.hoisted(() => vi.fn());
const apiGetSealedManifestAware = vi.hoisted(() => vi.fn());
const downloadScopedProxyFileGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/http", () => ({
  apiGet,
  apiPostJson,
}));

vi.mock("@/lib/api/api-get-sealed-manifest-aware", () => ({
  apiGetSealedManifestAware,
}));

vi.mock("@/lib/api/downloads-blob-trigger-scoped-proxy", () => ({
  downloadScopedProxyFileGet,
}));

import { createAdvisorySchedule } from "@/lib/api/advisory-digests-list";
import { createAlertRule, createCompositeAlertRule } from "@/lib/api/alerts-routing-api-rules";
import { dryRunOutboundWebhook } from "@/lib/api/alerts-routing-api-subscriptions";
import { parseChatIntake } from "@/lib/api/architecture-chat-intake-api";
import { parseConnectorIntake } from "@/lib/api/architecture-connector-intake-api";
import { getComparisonDriftReportDownloadUrl, downloadComparisonDriftReport } from "@/lib/api/comparison-drift-api";
import { compareExportRecords } from "@/lib/api/export-record-compare-api";
import {
  getArtifactDownloadUrl,
  getManifestCompareExportDownloadUrl,
} from "@/lib/api/downloads-blob-urls";
import { validatePolicyPackContentDocument } from "@/lib/api/policy-pack-validate-api";
import { batchReviewGovernanceApprovalRequests } from "@/lib/api/governance-workflow-api-approvals";

afterEach(() => {
  apiGet.mockReset();
  apiPostJson.mockReset();
  apiGetSealedManifestAware.mockReset();
  downloadScopedProxyFileGet.mockReset();
});

describe("next API boundary hardening", () => {
  it("rejects blank simple and composite alert rule fields before POST", async () => {
    await expect(createAlertRule({
      name: " ",
      ruleType: "threshold",
      severity: "High",
      thresholdValue: 1,
    })).rejects.toThrow("name is required.");

    await expect(createCompositeAlertRule({
      name: "rule",
      severity: "High",
      operator: "AND",
      suppressionWindowMinutes: 1,
      cooldownMinutes: 1,
      reopenDeltaThreshold: 1,
      dedupeScope: "run",
      conditions: [{ metricType: " ", operator: ">", thresholdValue: 1 }],
    })).rejects.toThrow("Composite alert condition fields are required.");

    expect(apiPostJson).not.toHaveBeenCalled();
  });

  it("rejects blank required intake and webhook inputs", async () => {
    await expect(createAdvisorySchedule({ name: " ", cronExpression: "0 * * * *" }))
      .rejects.toThrow("name is required.");
    await expect(parseChatIntake("   ")).rejects.toThrow("rawText is required.");
    await expect(parseConnectorIntake({ source: "git-terraform" }))
      .rejects.toThrow("gitRepositoryUrl is required");
    await expect(dryRunOutboundWebhook({ targetUrl: " " }))
      .rejects.toThrow("targetUrl is required.");
  });

  it("keeps synchronous download URLs render-safe while trimming ids", () => {
    expect(getArtifactDownloadUrl(" manifest-1 ", " artifact/1 ")).toContain(
      "/signed-review-records/manifest-1/artifact/artifact%2F1",
    );
    expect(getManifestCompareExportDownloadUrl(" ", " v2 ")).toContain("rightVersion=v2");
    expect(getManifestCompareExportDownloadUrl(" ", " v2 ")).not.toContain("leftVersion=");
    expect(getComparisonDriftReportDownloadUrl(" run/1 ")).toContain("/comparisons/run%2F1/");
  });

  it("rejects blank ids before comparison and drift downloads", async () => {
    await expect(compareExportRecords(" ", "right")).rejects.toThrow("leftExportRecordId is required.");
    await expect(downloadComparisonDriftReport({ comparisonRecordId: " " }))
      .rejects.toThrow("comparisonRecordId is required.");
    expect(apiGetSealedManifestAware).not.toHaveBeenCalled();
    expect(downloadScopedProxyFileGet).not.toHaveBeenCalled();
  });

  it("rejects non-object policy validation content and blank approval batches", async () => {
    await expect(validatePolicyPackContentDocument([])).rejects.toThrow(
      "Policy pack content must be a JSON object.",
    );
    await expect(batchReviewGovernanceApprovalRequests({
      approvalRequestIds: [" ", ""],
      decision: "approve",
    })).rejects.toThrow("approvalRequestIds is required.");
    expect(apiPostJson).not.toHaveBeenCalled();
  });
});
