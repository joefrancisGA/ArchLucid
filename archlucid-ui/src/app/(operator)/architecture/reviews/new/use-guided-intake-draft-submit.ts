"use client";

import { useCallback } from "react";

import { getDraftRequest, submitDraftRequest } from "@/lib/api/draft-intake-api";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { recordArchitectureCreationHandoff } from "@/lib/architecture/architecture-creation-handoff";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { uploadWizardPendingDocumentEvidence } from "@/lib/wizard-pending-evidence-upload";

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import type { GuidedIntakeDraftCoreState } from "./use-guided-intake-draft-workflow";

type Options = {
  readonly form: GuidedIntakeBriefForm;
  readonly isCreateArchitectureFlow: boolean;
  readonly navigate: (href: string) => void;
  readonly clearSession: () => void;
  readonly core: GuidedIntakeDraftCoreState;
};

export function useGuidedIntakeDraftSubmit(options: Options) {
  const { clearSession, core, form, isCreateArchitectureFlow, navigate } = options;
  const { actorSet, businessOutcome, freeTextIntent, systemName } = form;

  const submitDraft = useCallback(async () => {
    if (core.draftId === null) {
      return;
    }

    core.setBusy(true);
    core.setSubmitError(null);

    const filesToUpload = [...form.evidenceFiles];

    try {
      const draftBeforeSubmit = await getDraftRequest(core.draftId);
      const result = await submitDraftRequest(core.draftId, draftBeforeSubmit.updatedUtc);
      const submittedDraft = await getDraftRequest(core.draftId);
      core.setDraftStatus(submittedDraft.status);
      core.setLinkedSpawnedRunId(architectureDraftSpawnedRunId(submittedDraft));

      if (filesToUpload.length > 0) {
        const uploadResult = await uploadWizardPendingDocumentEvidence(result.runId, filesToUpload);

        if (!uploadResult.ok) {
          core.setSubmitError(new Error(uploadResult.message));

          return;
        }

        form.setEvidenceFiles([]);
      }

      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(submittedDraft, { linkedReviewId: result.runId }),
      );
      await invalidateOperatorHomeRunsCaches();
      recordFirstTenantFunnelEvent("first_run_started");
      trackReviewPipelineInFlight(result.runId);
      clearSession();

      const compareParentRunId = result.parentSpawnedRunId ?? core.parentSpawnedRunId;

      if (compareParentRunId !== null && compareParentRunId.trim().length > 0) {
        navigate(runDetailHrefWithParentRun(result.runId, compareParentRunId));

        return;
      }

      if (isCreateArchitectureFlow) {
        recordArchitectureCreationHandoff({
          runId: result.runId,
          architectureName: systemName.trim(),
          architectureOverview: freeTextIntent.trim(),
          businessOutcome: businessOutcome.trim(),
          peopleAndSystems: actorSet.actors.map((actor) => ({
            label: actor.label?.trim() || actor.kind,
            kind: actor.kind,
          })),
        });
      }

      navigate(
        buildReviewGenerationRedirect(
          result.runId,
          isCreateArchitectureFlow ? "create-architecture" : "socratic-intake",
          { architectureCreation: isCreateArchitectureFlow },
        ),
      );
    } catch (error) {
      core.setSubmitError(error);
    } finally {
      core.setBusy(false);
    }
  }, [
    actorSet.actors,
    businessOutcome,
    clearSession,
    core,
    form,
    freeTextIntent,
    isCreateArchitectureFlow,
    navigate,
    systemName,
  ]);

  return {
    submitDraft,
  };
}
