import { withLivelihood401Resume } from "@/lib/auth/livelihood-mutation-401-resume";
import type {
  ArchitectureDraftPatchPendingPayload,
  ArchitectureReviewFinalizePendingPayload,
  ArchitectureShareGrantPendingPayload,
  FindingBulkDispositionPendingPayload,
  GovernanceWorkflowTransitionPendingPayload,
  ItsmConnectorSavePendingPayload,
  PolicyPackSavePendingPayload,
  RiskExceptionWritePendingPayload,
} from "@/lib/auth/livelihood-mutation-401-resume-kinds";
import { commitArchitectureRun } from "@/lib/api/architecture-runs-lifecycle";
import { patchDraftRequest } from "@/lib/api/draft-intake-api";
import { upsertAzureBoardsSettings } from "@/lib/api/azure-boards-api";
import { upsertTeamsIncomingWebhookConnection } from "@/lib/api/advisory-digests-read-export";
import {
  patchArchitectureRestrictToShares,
  putArchitectureShare,
  revokeArchitectureShare,
} from "@/lib/api/architecture-share-api";
import { recordBulkFindingDisposition } from "@/lib/api/governance-stickiness-api";
import {
  renewRiskException,
  revokeRiskException,
} from "@/lib/api/governance-stickiness-api";
import {
  activateEnvironment,
  approveRequest,
  promoteManifest,
  rejectRequest,
  submitApprovalRequest,
} from "@/lib/api/governance-workflow-api";
import { createPolicyPack, publishPolicyPackVersion } from "@/lib/api/policy-packs-api-mutate";
import {
  upsertTenantItsmConnectorConnection,
  upsertTenantItsmOutboundSettings,
} from "@/lib/api/itsm-outbound-connections-settings";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";

export type Livelihood401ResumeOptions = {
  readonly returnPath: string;
  readonly idempotencyKey?: string;
};

function resolveIdempotencyKey(provided?: string): string {
  const trimmed = provided?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : createGovernanceMutationIdempotencyKey();
}

export async function patchDraftRequestWith401Resume(
  draftId: string,
  body: ArchitectureDraftPatchPendingPayload["body"],
  options: Livelihood401ResumeOptions,
): Promise<Awaited<ReturnType<typeof patchDraftRequest>>> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "architecture_draft_patch",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: { draftId, body },
    execute: () => patchDraftRequest(draftId, body),
  });
}

export async function recordBulkFindingDispositionWith401Resume(
  body: FindingBulkDispositionPendingPayload["body"],
  options: Livelihood401ResumeOptions & { readonly idempotencyKey: string },
): Promise<Awaited<ReturnType<typeof recordBulkFindingDisposition>>> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "finding_bulk_disposition",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: { body },
    execute: () => recordBulkFindingDisposition(body, { idempotencyKey }),
  });
}

export async function commitArchitectureRunWith401Resume(
  runId: string,
  body: ArchitectureReviewFinalizePendingPayload["body"],
  options: Livelihood401ResumeOptions,
): Promise<unknown> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "architecture_review_finalize",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: { runId, body },
    execute: () =>
      commitArchitectureRun(runId, {
        notifySponsor: body.notifySponsor,
        acknowledgedAssumptionIds: [...body.acknowledgedAssumptionIds],
      }, { idempotencyKey }),
  });
}

export async function submitGovernanceWorkflowTransitionWith401Resume(
  payload: GovernanceWorkflowTransitionPendingPayload,
  options: Livelihood401ResumeOptions,
): Promise<unknown> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "governance_workflow_transition",
    returnPath: options.returnPath,
    idempotencyKey,
    payload,
    execute: async () => {
      switch (payload.action) {
        case "submit_approval": {
          return await submitApprovalRequest(payload.body as Parameters<typeof submitApprovalRequest>[0]);
        }

        case "approve": {
          const approvalRequestId = payload.approvalRequestId?.trim() ?? "";

          return await approveRequest(approvalRequestId, payload.body as Parameters<typeof approveRequest>[1]);
        }

        case "reject": {
          const approvalRequestId = payload.approvalRequestId?.trim() ?? "";

          return await rejectRequest(approvalRequestId, payload.body as Parameters<typeof rejectRequest>[1]);
        }

        case "promote": {
          return await promoteManifest(payload.body as Parameters<typeof promoteManifest>[0]);
        }

        case "activate": {
          return await activateEnvironment(payload.body as Parameters<typeof activateEnvironment>[0]);
        }

        default: {
          const exhaustiveAction: never = payload.action;
          throw new Error(`Unsupported governance workflow transition: ${exhaustiveAction}`);
        }
      }
    },
  });
}

export async function createPolicyPackWith401Resume(
  body: Parameters<typeof createPolicyPack>[0],
  options: Livelihood401ResumeOptions,
): Promise<Awaited<ReturnType<typeof createPolicyPack>>> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "policy_pack_save",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: {
      operation: "create",
      body: body as Record<string, unknown>,
      autoReplay: true,
    },
    execute: () => createPolicyPack(body),
  });
}

export async function publishPolicyPackVersionWith401Resume(
  policyPackId: string,
  body: Parameters<typeof publishPolicyPackVersion>[1],
  options: Livelihood401ResumeOptions,
): Promise<Awaited<ReturnType<typeof publishPolicyPackVersion>>> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "policy_pack_save",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: {
      operation: "publish",
      policyPackId,
      body: body as Record<string, unknown>,
      autoReplay: false,
    },
    execute: () => publishPolicyPackVersion(policyPackId, body),
  });
}

export async function saveItsmConnectorWith401Resume(
  payload: ItsmConnectorSavePendingPayload,
  options: Livelihood401ResumeOptions,
): Promise<unknown> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "itsm_connector_save",
    returnPath: options.returnPath,
    idempotencyKey,
    payload,
    execute: async () => {
      switch (payload.connector) {
        case "azureboards_connection": {
          return await upsertTenantItsmConnectorConnection(
            "azureboards",
            payload.body as Parameters<typeof upsertTenantItsmConnectorConnection>[1],
          );
        }

        case "azureboards_settings": {
          return await upsertAzureBoardsSettings(
            payload.body as Parameters<typeof upsertAzureBoardsSettings>[0],
          );
        }

        case "jira_settings":
        case "servicenow_settings": {
          return await upsertTenantItsmOutboundSettings(
            payload.body as Parameters<typeof upsertTenantItsmOutboundSettings>[0],
          );
        }

        case "teams_webhook": {
          return await upsertTeamsIncomingWebhookConnection(
            payload.body as Parameters<typeof upsertTeamsIncomingWebhookConnection>[0],
          );
        }

        default: {
          const exhaustiveConnector: never = payload.connector;
          throw new Error(`Unsupported ITSM connector save: ${exhaustiveConnector}`);
        }
      }
    },
  });
}

export async function mutateArchitectureShareWith401Resume(
  payload: ArchitectureShareGrantPendingPayload,
  options: Livelihood401ResumeOptions,
): Promise<unknown> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "architecture_share_grant",
    returnPath: options.returnPath,
    idempotencyKey,
    payload,
    execute: async () => {
      switch (payload.operation) {
        case "grant": {
          return await putArchitectureShare(
            payload.architectureId,
            payload.body as Parameters<typeof putArchitectureShare>[1],
          );
        }

        case "revoke": {
          const targetActorOid = payload.targetActorOid?.trim() ?? "";

          return await revokeArchitectureShare(payload.architectureId, targetActorOid);
        }

        case "restrict": {
          return await patchArchitectureRestrictToShares(
            payload.architectureId,
            payload.body as Parameters<typeof patchArchitectureRestrictToShares>[1],
          );
        }

        default: {
          const exhaustiveOperation: never = payload.operation;
          throw new Error(`Unsupported architecture share operation: ${exhaustiveOperation}`);
        }
      }
    },
  });
}

export async function renewRiskExceptionWith401Resume(
  riskExceptionId: string,
  body: NonNullable<RiskExceptionWritePendingPayload["body"]>,
  options: Livelihood401ResumeOptions,
): Promise<Awaited<ReturnType<typeof renewRiskException>>> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "risk_exception_write",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: {
      riskExceptionId,
      operation: "renew",
      body,
    },
    execute: () => renewRiskException(riskExceptionId, body),
  });
}

export async function revokeRiskExceptionWith401Resume(
  riskExceptionId: string,
  options: Livelihood401ResumeOptions,
): Promise<void> {
  const idempotencyKey = resolveIdempotencyKey(options.idempotencyKey);

  return withLivelihood401Resume({
    kind: "risk_exception_write",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: {
      riskExceptionId,
      operation: "revoke",
    },
    execute: () => revokeRiskException(riskExceptionId),
  });
}
