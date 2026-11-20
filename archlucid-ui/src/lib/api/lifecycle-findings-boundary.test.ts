import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseJsonRecord,
  requireRecord,
  trimNullableText,
  trimRequiredText,
  trimStringRecord,
  trimTextFields,
  trimmedStringsOnly,
} from "@/lib/api/api-boundary-normalization";
import { getArchitectureSealDelta } from "@/lib/api/architecture-seal-delta-api";
import { attachArchitectureInventoryBinding } from "@/lib/api/architecture-inventory-binding-api";
import { archiveArchitectureRequest, executeArchitectureRunSelective } from "@/lib/api/architecture-runs-lifecycle";
import { getArtifactDescriptor, getManifestSummary } from "@/lib/api/architecture-runs-artifacts";
import { listRunsByProject } from "@/lib/api/architecture-runs-list";
import { recordSponsorPreliminaryArchitectureShare } from "@/lib/api/architecture-sponsor-sharing-api";
import {
  getAuthorityProvenanceGraph,
  getAuthorityProvenanceNodeNeighborhood,
} from "@/lib/api/authority-provenance-query-api";
import { triggerAwsTier2HostedRun } from "@/lib/api/aws-cloud-connections-api";
import { fetchAzureBoardsSettings, upsertAzureBoardsSettings } from "@/lib/api/azure-boards-api";
import { validateTier2ConnectionHostedRun } from "@/lib/api/cloud-connections-api";
import {
  getArtifactDownloadUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
} from "@/lib/api/downloads-blob-urls";
import {
  createDraftRequest,
  getDraftRequest,
  listDraftRequests,
  patchDraftRequest,
} from "@/lib/api/draft-intake-api-crud";
import { tryAcquireDraftWorkLease } from "@/lib/api/draft-intake-api-work-lease";
import { getFinalizeReadiness } from "@/lib/api/finalize-readiness";
import { getFindingInsightSignalStatus, postFindingInsightSignal } from "@/lib/api/finding-insight-signal-api";
import { upsertFindingRemediationAssignment } from "@/lib/api/finding-remediation-assignment-api";
import {
  getFindingExplainability,
  postArchitectureFindingFeedback,
  postFindingMute,
} from "@/lib/api/findings-api";
import { createItsmOutboundIssueWithJobPolling } from "@/lib/api/itsm-outbound-create";
import { upsertTenantItsmConnectorConnection } from "@/lib/api/itsm-outbound-connections-settings";
import { applyKnowledgeModelClarificationAnswers } from "@/lib/api/knowledge-model-clarification-api";
import { downloadSponsorProofPackZip } from "@/lib/api/pilots-collateral-download-api";
import { fetchPolicyPacksPageBundle, listPolicyPackVersions } from "@/lib/api/policy-packs-api-catalog";
import { publishPolicyPackVersion } from "@/lib/api/policy-packs-api-mutate";
import {
  fetchRecommendationLearningHistory,
  fetchRecommendationLearningOpsPageBundle,
  rollbackRecommendationLearningProfile,
} from "@/lib/api/recommendation-learning-operational-api";
import { patchRunCoveragePack, putRunCoverageAcknowledgement } from "@/lib/api/run-coverage-api";
import { patchTechnologyLedgerEntry } from "@/lib/api/technology-ledger";
import {
  fetchAlertActionLoop,
  fetchCorePilotTeamChecklist,
  putCorePilotTeamChecklistStep,
  submitProductFeedback,
} from "@/lib/api/tenant-customer-success";
import { toTier2HostedRunResult } from "@/lib/api/tier2-hosted-run-response";

const downloadScopedProxyFileGet = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/api/downloads-blob-trigger-scoped-proxy", () => ({
  downloadScopedProxyFileGet: (...args: unknown[]) => downloadScopedProxyFileGet(...args),
}));

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
  downloadScopedProxyFileGet.mockClear();
});

describe("boundary normalization helpers", () => {
  it("trims named text fields and leaves absent, null, and unnamed values alone", () => {
    const body: { name: string; note?: string | null; json: string; flag: boolean } = {
      name: "  pack  ",
      note: null,
      json: " { } ",
      flag: true,
    };

    expect(trimTextFields(body, ["name", "note"])).toEqual({ name: "pack", note: null, json: " { } ", flag: true });
    expect(Object.keys(trimTextFields({ name: " a " } as { name: string; note?: string }, ["name", "note"])))
      .toEqual(["name"]);
  });

  it("keeps an empty string when trimming nullable text", () => {
    expect(trimNullableText("   ")).toBe("");
    expect(trimNullableText(null)).toBeNull();
    expect(trimNullableText(undefined)).toBeUndefined();
  });

  it("rejects blank required text by field name", () => {
    expect(trimRequiredText("  why  ", "reason")).toBe("why");
    expect(() => trimRequiredText("   ", "reason")).toThrow("reason is required.");
  });

  it("drops blank pairs from a text map and non-text entries from a list", () => {
    expect(trimStringRecord({ " q1 ": " yes ", q2: "   ", "  ": "orphan" })).toEqual({ q1: "yes" });
    expect(trimmedStringsOnly([" a ", 1, null, "  ", "b"])).toEqual(["a", "b"]);
    expect(trimmedStringsOnly("not-a-list")).toEqual([]);
  });

  it("accepts only JSON objects as records", () => {
    expect(requireRecord<{ a: number }>({ a: 1 }, "Sample")).toEqual({ a: 1 });
    expect(() => requireRecord([], "Sample")).toThrow("Sample response was not recognized.");
    expect(parseJsonRecord('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonRecord("[1]")).toBeNull();
    expect(parseJsonRecord("null")).toBeNull();
    expect(parseJsonRecord("")).toBeNull();
    expect(parseJsonRecord("{not json")).toBeNull();
  });
});

describe("blank identifiers are rejected before any request", () => {
  it.each([
    ["runId", () => getFindingExplainability("  ", "finding-1")],
    ["findingId", () => getFindingExplainability("run-1", "  ")],
    ["runId", () => getFinalizeReadiness("  ")],
    ["runId", () => getAuthorityProvenanceGraph("  ")],
    ["nodeId", () => getAuthorityProvenanceNodeNeighborhood("run-1", "  ")],
    ["projectId", () => listRunsByProject("  ")],
    ["runId", () => executeArchitectureRunSelective("  ", {})],
    ["requestId", () => archiveArchitectureRequest("  ")],
    ["runId", () => postFindingInsightSignal("  ", "finding-1")],
    ["findingId", () => upsertFindingRemediationAssignment("  ", { runId: "run-1" })],
    ["runId", () => upsertFindingRemediationAssignment("finding-1", { runId: "  " })],
    ["entryId", () => patchTechnologyLedgerEntry("run-1", "  ", {})],
    ["architectureId", () => getArchitectureSealDelta("  ")],
    ["snapshotId", () => attachArchitectureInventoryBinding("arch-1", { snapshotId: "  " })],
    ["policyPackId", () => publishPolicyPackVersion("  ", { version: "1.0.0" })],
    ["draftId", () => getDraftRequest("  ")],
    ["freeTextIntent", () => createDraftRequest("   ")],
    ["draftId", () => tryAcquireDraftWorkLease("  ")],
    ["manifestId", () => getManifestSummary("  ")],
    ["artifactId", () => getArtifactDescriptor("manifest-1", "  ")],
    ["runId", () => downloadSponsorProofPackZip("  ")],
    ["alertId", () => fetchAlertActionLoop("  ")],
    ["findingId", () => createItsmOutboundIssueWithJobPolling("  ", "Jira")],
    ["connectionId", () => triggerAwsTier2HostedRun({ connectionId: "  " })],
    ["subscriptionId", () => validateTier2ConnectionHostedRun({ subscriptionId: "  " })],
    ["reason", () => postFindingMute("run-1", "finding-1", "   ")],
  ])("rejects a blank %s", async (fieldName, call) => {
    const fetchMock = installFetch({});

    await expect(call()).rejects.toThrow(`${fieldName} is required.`);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(downloadScopedProxyFileGet).not.toHaveBeenCalled();
  });

  it("rejects clarification answers that are all blank", async () => {
    const fetchMock = installFetch({});

    await expect(applyKnowledgeModelClarificationAnswers("run-1", { q1: "   " })).rejects.toThrow(
      "answers is required.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a checklist step index that is negative or fractional", async () => {
    const fetchMock = installFetch({});

    await expect(putCorePilotTeamChecklistStep(-1, true)).rejects.toThrow("stepIndex must be");
    await expect(putCorePilotTeamChecklistStep(1.5, true)).rejects.toThrow("stepIndex must be");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("request paths and bodies are normalized", () => {
  it("trims the mute body and path", async () => {
    const fetchMock = installFetch({});

    await postFindingMute("  run-1  ", "  finding 1  ", "  duplicate  ");

    expect(requestUrl(fetchMock)).toContain("/v1/findings/finding%201/mute");
    expect(requestBody(fetchMock)).toEqual({ runId: "run-1", reason: "duplicate" });
  });

  it("sends a blank feedback comment as null", async () => {
    const fetchMock = installFetch({});

    await postArchitectureFindingFeedback(" run-1 ", "finding-1", true, "   ");

    expect(requestBody(fetchMock)).toEqual({ runId: "run-1", isHelpful: true, comment: null });
  });

  it("keeps a null assignee when trimming a remediation assignment", async () => {
    const fetchMock = installFetch({});

    await upsertFindingRemediationAssignment(" finding-1 ", {
      runId: " run-1 ",
      assignedToUserId: null,
      remediationDueUtc: " 2026-12-01T00:00:00Z ",
    });

    expect(requestUrl(fetchMock)).toContain("/v1/findings/finding-1/remediation-assignment");
    expect(requestBody(fetchMock)).toEqual({
      runId: "run-1",
      assignedToUserId: null,
      remediationDueUtc: "2026-12-01T00:00:00Z",
    });
  });

  it("drops blank selective-execute entries and defaults the provenance depth", async () => {
    const selectiveFetch = installFetch({});

    await executeArchitectureRunSelective(" run-1 ", { agentTypes: [" topology ", "  "], taskIds: [] });

    expect(requestUrl(selectiveFetch)).toContain("/v1/architecture/review/run-1/execute/selective");
    expect(requestBody(selectiveFetch)).toEqual({ agentTypes: ["topology"], taskIds: [], includeDependents: true });

    const graphFetch = installFetch({ nodes: [], edges: [] });

    await getAuthorityProvenanceNodeNeighborhood(" run-1 ", " node/1 ", 0);

    expect(requestUrl(graphFetch)).toContain("/v1/authority/runs/run-1/graph/node/node%2F1");
    expect(requestUrl(graphFetch)).not.toContain("depth=");
  });

  it("trims the sponsor share record", async () => {
    const fetchMock = installFetch({});

    await recordSponsorPreliminaryArchitectureShare(" run-1 ", {
      readinessStatus: " Preliminary ",
      knownGaps: [" gap one ", "   "],
      overrideAcknowledged: true,
      confidentialityLabel: "   ",
      deliveryMethod: " email ",
    });

    expect(requestUrl(fetchMock)).toContain("/v1/pilots/runs/run-1/sponsor-preliminary-share");
    expect(requestBody(fetchMock)).toEqual({
      readinessStatus: "Preliminary",
      knownGaps: ["gap one"],
      overrideAcknowledged: true,
      confidentialityLabel: null,
      deliveryMethod: "email",
    });
  });

  it("trims clarification answers and repairs a malformed count", async () => {
    const fetchMock = installFetch({ appliedCount: "not-a-number", reReviewTriggered: true });

    await expect(
      applyKnowledgeModelClarificationAnswers(" run-1 ", { " q1 ": " yes ", q2: "  " }),
    ).resolves.toEqual({ appliedCount: 0, reReviewTriggered: true });
    expect(requestBody(fetchMock)).toEqual({ answers: { q1: "yes" } });
  });

  it("encodes a coverage pack id once and drops entries without a pack id", async () => {
    const patchFetch = installFetch({ policyPackId: "pack/1", excluded: true });

    await patchRunCoveragePack(" run-1 ", " pack/1 ", { excluded: true, exclusionReason: " legacy " });

    expect(requestUrl(patchFetch)).toContain("/v1/runs/run-1/coverage/pack%2F1");
    expect(requestUrl(patchFetch)).not.toContain("%252F");
    expect(requestBody(patchFetch)).toEqual({ excluded: true, exclusionReason: "legacy" });

    const putFetch = installFetch({ entries: [] });

    await putRunCoverageAcknowledgement("run-1", [
      { policyPackId: " pack-1 ", excluded: false },
      { policyPackId: "   ", excluded: true, exclusionReason: " none " },
    ]);

    expect(requestBody(putFetch)).toEqual({ entries: [{ policyPackId: "pack-1", excluded: false }] });
  });

  it("keeps an empty string in a draft patch so the field can be cleared", async () => {
    const fetchMock = installFetch({ draftId: "draft-1" });

    await patchDraftRequest(" draft-1 ", { systemName: "   ", businessOutcome: " faster reviews " });

    expect(requestUrl(fetchMock)).toContain("/v1/architecture/draft/draft-1");
    expect(requestBody(fetchMock)).toEqual({ systemName: "", businessOutcome: "faster reviews" });
  });

  it("omits invalid paging values from the draft list query", async () => {
    const fetchMock = installFetch({ items: [] });

    await listDraftRequests({ mine: true, page: 0, pageSize: 2.5 });

    expect(requestUrl(fetchMock)).toContain("mine=true");
    expect(requestUrl(fetchMock)).not.toContain("page");

    const validFetch = installFetch({ items: [] });

    await listDraftRequests({ page: 2, pageSize: 25 });

    expect(requestUrl(validFetch)).toContain("page=2");
    expect(requestUrl(validFetch)).toContain("pageSize=25");
  });

  it("omits a blank hosted-run id and trims the connection id", async () => {
    const fetchMock = installFetch({ packageId: " pkg-1 ", resourceCount: 12 });

    await expect(triggerAwsTier2HostedRun({ connectionId: " conn-1 ", runId: "   " })).resolves.toEqual({
      packageId: "pkg-1",
      resourceCount: 12,
    });
    expect(requestBody(fetchMock)).toEqual({ connectionId: "conn-1" });
  });

  it("trims Azure Boards settings and ITSM connection fields", async () => {
    const boardsFetch = installFetch({ isConfigured: true });

    await upsertAzureBoardsSettings({ projectName: " Pilot ", defaultWorkItemType: " Task ", areaPath: null });

    expect(requestBody(boardsFetch)).toEqual({ projectName: "Pilot", defaultWorkItemType: "Task", areaPath: null });

    const itsmFetch = installFetch({ isConfigured: true });

    await upsertTenantItsmConnectorConnection("jira", {
      instanceBaseUrl: " https://example.atlassian.net ",
      credentialKeyVaultSecretName: " jira-token ",
      isEnabled: true,
    });

    expect(requestBody(itsmFetch)).toEqual({
      instanceBaseUrl: "https://example.atlassian.net",
      credentialKeyVaultSecretName: "jira-token",
      isEnabled: true,
    });
  });

  it("trims rollback text and falls back to the default history size", async () => {
    const rollbackFetch = installFetch({ generatedUtc: "2026-01-01T00:00:00Z" });

    await rollbackRecommendationLearningProfile({ profileId: " profile-1 ", reason: " regression " });

    expect(requestBody(rollbackFetch)).toEqual({ profileId: "profile-1", reason: "regression" });

    const historyFetch = installFetch([null, { profileId: "profile-1" }, "junk"]);

    await expect(fetchRecommendationLearningHistory(-5)).resolves.toEqual([{ profileId: "profile-1" }]);
    expect(requestUrl(historyFetch)).toContain("take=20");
  });

  it("leaves the feedback score alone, including thumbs down", async () => {
    const fetchMock = installFetch({});

    await submitProductFeedback({ score: -1, comment: " too slow ", runId: null });

    expect(requestBody(fetchMock)).toEqual({ score: -1, comment: "too slow", runId: null });
  });

  it("uses the trimmed run id for the collateral URL and file name", async () => {
    await downloadSponsorProofPackZip("  run 1  ");

    expect(downloadScopedProxyFileGet).toHaveBeenCalledWith(
      "/api/proxy/v1/pilots/runs/run%201/sponsor-proof-pack.zip",
      expect.objectContaining({ defaultFileName: "sponsor-proof-pack-run 1.zip" }),
    );
  });

  it("encodes ids in download URLs without throwing during render", () => {
    expect(getArtifactDownloadUrl("m/1", "a 1")).toBe(
      "/api/proxy/v1/artifacts/signed-review-records/m%2F1/artifact/a%201",
    );
    expect(getBundleDownloadUrl("m/1")).toBe("/api/proxy/v1/artifacts/signed-review-records/m%2F1/bundle");
    expect(getRunExportDownloadUrl("run/1")).toBe("/api/proxy/v1/artifacts/runs/run%2F1/export");
    expect(() => getRunExportDownloadUrl("")).not.toThrow();
  });
});

describe("malformed responses fail closed", () => {
  it("keeps only known insight signal kinds", async () => {
    installFetch({ kinds: ["Expected", "Unknown", 7, " DidNotThinkOfThat "] });

    await expect(getFindingInsightSignalStatus("run-1", "finding-1")).resolves.toEqual({
      kinds: ["Expected", "DidNotThinkOfThat"],
    });

    // apiGet itself rejects a null body, so the malformed case that reaches the mapper is a non-object.
    installFetch(["Expected"]);

    await expect(getFindingInsightSignalStatus("run-1", "finding-1")).resolves.toEqual({ kinds: [] });
  });

  it("distinguishes unavailable resource counts from measured zero in hosted runs", () => {
    expect(toTier2HostedRunResult({ packageId: 5, resourceCount: -3 })).toEqual({ packageId: "", resourceCount: null });
    expect(toTier2HostedRunResult({ packageId: " pkg " })).toEqual({ packageId: "pkg", resourceCount: null });
    expect(toTier2HostedRunResult({ packageId: "pkg", resourceCount: null }).resourceCount).toBeNull();
    expect(toTier2HostedRunResult({ packageId: "pkg", resourceCount: 0 }).resourceCount).toBe(0);
    expect(() => toTier2HostedRunResult(null)).toThrow("Hosted extractor run response was not recognized.");
  });

  it("turns malformed policy bundle parts into empty or null values", async () => {
    installFetch({ packs: [null, { policyPackId: "pack-1" }], effective: "broken", effectiveContent: [] });

    await expect(fetchPolicyPacksPageBundle()).resolves.toEqual({
      packs: [{ policyPackId: "pack-1" }],
      effective: null,
      effectiveContent: null,
    });

    installFetch({ packs: [], effective: { tenantId: "t-1" }, effectiveContent: { metadata: {} } });

    await expect(fetchPolicyPacksPageBundle()).resolves.toEqual({
      packs: [],
      effective: { tenantId: "t-1", packs: [] },
      effectiveContent: { metadata: {} },
    });

    installFetch([]);

    await expect(fetchPolicyPacksPageBundle()).rejects.toThrow("Policy packs page bundle response was not recognized.");
  });

  it("returns an empty list for malformed version and checklist responses", async () => {
    installFetch({ unexpected: true });

    await expect(listPolicyPackVersions("pack-1")).resolves.toEqual([]);

    installFetch("unexpected");

    await expect(fetchCorePilotTeamChecklist()).resolves.toEqual([]);

    installFetch([null, { stepIndex: 0, isCompleted: true, updatedUtc: "2026-01-01" }, 3]);

    await expect(fetchCorePilotTeamChecklist()).resolves.toEqual([
      { stepIndex: 0, isCompleted: true, updatedUtc: "2026-01-01" },
    ]);
  });

  it("requires a status in the recommendation learning page bundle", async () => {
    installFetch({ status: { isEnabled: true }, latestProfile: "broken", history: [null, { profileId: "p-1" }] });

    await expect(fetchRecommendationLearningOpsPageBundle(0)).resolves.toEqual({
      status: { isEnabled: true },
      latestProfile: null,
      history: [{ profileId: "p-1" }],
    });

    installFetch({ history: [] });

    await expect(fetchRecommendationLearningOpsPageBundle()).rejects.toThrow(
      "Recommendation learning status response was not recognized.",
    );
  });

  it("treats a non-object Azure Boards settings response as not configured", async () => {
    installFetch(["unexpected"]);

    await expect(fetchAzureBoardsSettings()).resolves.toEqual({});
  });

  it("reports a work lease as unavailable unless the body is usable", async () => {
    installFetch(null);

    await expect(tryAcquireDraftWorkLease("draft-1")).resolves.toEqual({ kind: "unavailable" });

    installFetch({ draftId: "draft-1" }, 409);

    await expect(tryAcquireDraftWorkLease("draft-1")).resolves.toEqual({ kind: "unavailable" });

    const conflict = { draftId: "draft-1", holderUserId: "user-2", holderActorOid: "oid-2", expiresUtc: "2026-01-01" };
    installFetch(conflict, 409);

    await expect(tryAcquireDraftWorkLease("draft-1")).resolves.toEqual({ kind: "held-by-other", conflict });

    const lease = { draftId: "draft-1", architectureId: "arch-1", acquiredUtc: "2026-01-01" };
    const acquiredFetch = installFetch(lease);

    await expect(tryAcquireDraftWorkLease(" draft-1 ")).resolves.toEqual({ kind: "acquired", lease });
    expect(requestUrl(acquiredFetch)).toContain("/v1/architecture/draft/draft-1/work-lease/acquire");
  });

  it("rejects an ITSM create response that is not an object or has no job id", async () => {
    installFetch(["unexpected"]);

    await expect(createItsmOutboundIssueWithJobPolling(" finding-1 ", "Jira")).rejects.toThrow(
      "ITSM create response was not recognized.",
    );

    installFetch({ jobId: "   " }, 202);

    await expect(createItsmOutboundIssueWithJobPolling("finding-1", "Jira")).rejects.toThrow(
      "ITSM create accepted but no job id was returned.",
    );

    const createdFetch = installFetch({ provider: "Jira", externalKey: "ARCH-1" });

    await expect(createItsmOutboundIssueWithJobPolling(" finding-1 ", "Jira")).resolves.toEqual({
      provider: "Jira",
      externalKey: "ARCH-1",
    });
    expect(requestBody(createdFetch)).toEqual({ findingId: "finding-1", provider: "Jira" });
  });
});
