import { beforeEach, describe, expect, it, vi } from "vitest";

import { replayLivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-replay";
import { LIVELIHOOD_PENDING_MUTATION_KINDS } from "@/lib/auth/livelihood-mutation-401-resume-kinds";

const recordFindingDisposition = vi.fn();
const recordBulkFindingDisposition = vi.fn();
const commitArchitectureRun = vi.fn();
const patchDraftRequest = vi.fn();
const recordGovernanceMutationCorrection = vi.fn();
const submitApprovalRequest = vi.fn();
const approveRequest = vi.fn();
const rejectRequest = vi.fn();
const promoteManifest = vi.fn();
const activateEnvironment = vi.fn();
const createPolicyPack = vi.fn();
const publishPolicyPackVersion = vi.fn();
const upsertTenantItsmConnectorConnection = vi.fn();
const upsertTenantItsmOutboundSettings = vi.fn();
const upsertAzureBoardsSettings = vi.fn();
const upsertTeamsIncomingWebhookConnection = vi.fn();
const putArchitectureShare = vi.fn();
const revokeArchitectureShare = vi.fn();
const patchArchitectureRestrictToShares = vi.fn();
const renewRiskException = vi.fn();
const revokeRiskException = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordFindingDisposition: (...args: unknown[]) => recordFindingDisposition(...args),
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
  renewRiskException: (...args: unknown[]) => renewRiskException(...args),
  revokeRiskException: (...args: unknown[]) => revokeRiskException(...args),
}));

vi.mock("@/lib/governance/governance-mutation-correction-api", () => ({
  recordGovernanceMutationCorrection: (...args: unknown[]) => recordGovernanceMutationCorrection(...args),
}));

vi.mock("@/lib/api/architecture-runs-lifecycle", () => ({
  commitArchitectureRun: (...args: unknown[]) => commitArchitectureRun(...args),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
}));

vi.mock("@/lib/api/governance-workflow-api", () => ({
  submitApprovalRequest: (...args: unknown[]) => submitApprovalRequest(...args),
  approveRequest: (...args: unknown[]) => approveRequest(...args),
  rejectRequest: (...args: unknown[]) => rejectRequest(...args),
  promoteManifest: (...args: unknown[]) => promoteManifest(...args),
  activateEnvironment: (...args: unknown[]) => activateEnvironment(...args),
}));

vi.mock("@/lib/api/policy-packs-api-mutate", () => ({
  createPolicyPack: (...args: unknown[]) => createPolicyPack(...args),
  publishPolicyPackVersion: (...args: unknown[]) => publishPolicyPackVersion(...args),
}));

vi.mock("@/lib/api/itsm-outbound-connections-settings", () => ({
  upsertTenantItsmConnectorConnection: (...args: unknown[]) => upsertTenantItsmConnectorConnection(...args),
  upsertTenantItsmOutboundSettings: (...args: unknown[]) => upsertTenantItsmOutboundSettings(...args),
}));

vi.mock("@/lib/api/azure-boards-api", () => ({
  upsertAzureBoardsSettings: (...args: unknown[]) => upsertAzureBoardsSettings(...args),
}));

vi.mock("@/lib/api/advisory-digests-read-export", () => ({
  upsertTeamsIncomingWebhookConnection: (...args: unknown[]) => upsertTeamsIncomingWebhookConnection(...args),
}));

vi.mock("@/lib/api/architecture-share-api", () => ({
  putArchitectureShare: (...args: unknown[]) => putArchitectureShare(...args),
  revokeArchitectureShare: (...args: unknown[]) => revokeArchitectureShare(...args),
  patchArchitectureRestrictToShares: (...args: unknown[]) => patchArchitectureRestrictToShares(...args),
}));

describe("replayLivelihoodPendingMutation (LW-063 / LW-066)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordFindingDisposition.mockResolvedValue({ eventId: "evt-1" });
    recordBulkFindingDisposition.mockResolvedValue({ appliedCount: 1 });
    commitArchitectureRun.mockResolvedValue({ runId: "run-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "d-1" });
    recordGovernanceMutationCorrection.mockResolvedValue({ ok: true });
    submitApprovalRequest.mockResolvedValue({ ok: true });
    approveRequest.mockResolvedValue({ ok: true });
    rejectRequest.mockResolvedValue({ ok: true });
    promoteManifest.mockResolvedValue({ ok: true });
    activateEnvironment.mockResolvedValue({ ok: true });
    createPolicyPack.mockResolvedValue({ policyPackId: "pack-1" });
    publishPolicyPackVersion.mockResolvedValue({ ok: true });
    upsertTenantItsmConnectorConnection.mockResolvedValue({ ok: true });
    upsertTenantItsmOutboundSettings.mockResolvedValue({ ok: true });
    upsertAzureBoardsSettings.mockResolvedValue({ ok: true });
    upsertTeamsIncomingWebhookConnection.mockResolvedValue({ ok: true });
    putArchitectureShare.mockResolvedValue({ ok: true });
    revokeArchitectureShare.mockResolvedValue(undefined);
    patchArchitectureRestrictToShares.mockResolvedValue({ ok: true });
    renewRiskException.mockResolvedValue({ ok: true });
    revokeRiskException.mockResolvedValue(undefined);
  });

  it.each(LIVELIHOOD_PENDING_MUTATION_KINDS)("replays kind %s without throwing", async (kind) => {
    const pendingByKind = {
      finding_disposition: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/architecture/reviews/run-1/findings/f-1",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          findingId: "f-1",
          body: { disposition: "Accepted", runId: "run-1" },
        },
      },
      governance_mutation_correction: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/governance/findings",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          body: {
            mutationKind: "governance_keyboard_finding_disposition",
            subjectId: "f-1",
            runId: "run-1",
            rationale: "Replay",
          },
        },
      },
      architecture_draft_patch: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/architecture/drafts/d-1",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          draftId: "d-1",
          body: { expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" },
        },
      },
      finding_bulk_disposition: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/governance/findings",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          body: {
            findingIds: ["f-1"],
            disposition: "Accepted",
          },
        },
      },
      governance_workflow_transition: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/governance/workflow",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          action: "activate",
          body: { environmentId: "env-1" },
        },
      },
      architecture_review_finalize: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/architecture/reviews/run-1",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          runId: "run-1",
          body: {
            notifySponsor: false,
            acknowledgedAssumptionIds: [],
          },
        },
      },
      policy_pack_save: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/governance/policy-packs",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          operation: "create",
          body: { name: "Pack" },
          autoReplay: true,
        },
      },
      itsm_connector_save: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/integrations/jira",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          connector: "jira_settings",
          body: { jiraSendInfoSeverity: true },
        },
      },
      architecture_share_grant: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/architecture/desks/desk-1",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          architectureId: "arch-1",
          operation: "revoke",
          targetActorOid: "actor-1",
        },
      },
      risk_exception_write: {
        kind,
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        returnPath: "/governance/risk-exceptions",
        savedAtUtc: "2026-09-10T12:00:00.000Z",
        requestLeftClient: true,
        payload: {
          riskExceptionId: "risk-1",
          operation: "revoke",
        },
      },
    } as const;

    await expect(replayLivelihoodPendingMutation(pendingByKind[kind])).resolves.not.toThrow();
  });

  it("replays disposition with the stored idempotency key (LW-063)", async () => {
    const idempotencyKey = "22222222-2222-4222-8222-222222222222";

    await replayLivelihoodPendingMutation({
      kind: "finding_disposition",
      idempotencyKey,
      returnPath: "/architecture/reviews/run-2/findings/f-2",
      savedAtUtc: "2026-09-10T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        findingId: "f-2",
        body: {
          disposition: "Accepted",
          runId: "run-2",
        },
      },
    });

    expect(recordFindingDisposition).toHaveBeenCalledWith(
      "f-2",
      {
        disposition: "Accepted",
        runId: "run-2",
      },
      { idempotencyKey },
    );
  });
});
