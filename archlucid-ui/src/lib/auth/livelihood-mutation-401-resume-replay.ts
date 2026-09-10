import { commitArchitectureRun } from "@/lib/api/architecture-runs-lifecycle";
import { patchDraftRequest } from "@/lib/api/draft-intake-api";
import { upsertAzureBoardsSettings } from "@/lib/api/azure-boards-api";
import { upsertTeamsIncomingWebhookConnection } from "@/lib/api/advisory-digests-read-export";
import {
  patchArchitectureRestrictToShares,
  putArchitectureShare,
  revokeArchitectureShare,
} from "@/lib/api/architecture-share-api";
import { recordFindingDisposition, recordBulkFindingDisposition } from "@/lib/api/governance-stickiness-api";
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
import {
  createPolicyPack,
  publishPolicyPackVersion,
} from "@/lib/api/policy-packs-api-mutate";
import {
  upsertTenantItsmConnectorConnection,
  upsertTenantItsmOutboundSettings,
} from "@/lib/api/itsm-outbound-connections-settings";
import {
  clearLivelihoodPendingMutationReplayClaim,
  type ArchitectureDraftPatchPendingPayload,
  type ArchitectureReviewFinalizePendingPayload,
  type ArchitectureShareGrantPendingPayload,
  type FindingBulkDispositionPendingPayload,
  type FindingDispositionPendingPayload,
  type GovernanceMutationCorrectionPendingPayload,
  type GovernanceWorkflowTransitionPendingPayload,
  type ItsmConnectorSavePendingPayload,
  type LivelihoodPendingMutation,
  type PolicyPackSavePendingPayload,
  type RiskExceptionWritePendingPayload,
  writeLivelihoodPendingMutation,
} from "@/lib/auth/livelihood-mutation-401-resume";
import { notifyLivelihoodMutationReplayed } from "@/lib/auth/livelihood-mutation-replay-notify";
import { recordGovernanceMutationCorrection } from "@/lib/governance/governance-mutation-correction-api";

/** Replays one stored livelihood mutation with the same idempotency key (ADR 0076 / 0089). */
export async function replayLivelihoodPendingMutation(
  pending: LivelihoodPendingMutation,
): Promise<unknown> {
  try {
    switch (pending.kind) {
      case "finding_disposition": {
        const payload = pending.payload as FindingDispositionPendingPayload;

        return await recordFindingDisposition(payload.findingId, payload.body, {
          idempotencyKey: pending.idempotencyKey,
        });
      }

      case "governance_mutation_correction": {
        const payload = pending.payload as GovernanceMutationCorrectionPendingPayload;

        return await recordGovernanceMutationCorrection(payload.body, {
          idempotencyKey: pending.idempotencyKey,
        });
      }

      case "architecture_draft_patch": {
        const payload = pending.payload as ArchitectureDraftPatchPendingPayload;

        return await patchDraftRequest(payload.draftId, payload.body);
      }

      case "finding_bulk_disposition": {
        const payload = pending.payload as FindingBulkDispositionPendingPayload;

        return await recordBulkFindingDisposition(payload.body, {
          idempotencyKey: pending.idempotencyKey,
        });
      }

      case "governance_workflow_transition": {
        const payload = pending.payload as GovernanceWorkflowTransitionPendingPayload;

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
      }

      case "architecture_review_finalize": {
        const payload = pending.payload as ArchitectureReviewFinalizePendingPayload;

        return await commitArchitectureRun(
          payload.runId,
          {
            notifySponsor: payload.body.notifySponsor,
            acknowledgedAssumptionIds: [...payload.body.acknowledgedAssumptionIds],
          },
          { idempotencyKey: pending.idempotencyKey },
        );
      }

      case "policy_pack_save": {
        const payload = pending.payload as PolicyPackSavePendingPayload;

        if (!payload.autoReplay) {
          notifyLivelihoodMutationReplayed({ pending, result: null });

          return null;
        }

        if (payload.operation === "create") {
          return await createPolicyPack(payload.body as Parameters<typeof createPolicyPack>[0]);
        }

        const policyPackId = payload.policyPackId?.trim() ?? "";

        return await publishPolicyPackVersion(
          policyPackId,
          payload.body as Parameters<typeof publishPolicyPackVersion>[1],
        );
      }

      case "itsm_connector_save": {
        const payload = pending.payload as ItsmConnectorSavePendingPayload;

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
      }

      case "architecture_share_grant": {
        const payload = pending.payload as ArchitectureShareGrantPendingPayload;

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
      }

      case "risk_exception_write": {
        const payload = pending.payload as RiskExceptionWritePendingPayload;

        if (payload.operation === "renew") {
          return await renewRiskException(
            payload.riskExceptionId,
            payload.body ?? { expiresAtUtc: "" },
          );
        }

        return await revokeRiskException(payload.riskExceptionId);
      }

      default: {
        const exhaustiveKind: never = pending.kind;
        throw new Error(`Unsupported livelihood pending mutation kind: ${exhaustiveKind}`);
      }
    }
  } catch (error: unknown) {
    writeLivelihoodPendingMutation(pending);
    clearLivelihoodPendingMutationReplayClaim();

    throw error;
  } finally {
    clearLivelihoodPendingMutationReplayClaim();
  }
}
