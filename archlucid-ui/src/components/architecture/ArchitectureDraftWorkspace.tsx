"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  applyArchitectureCreationDraftToFormState,
  architectureCreationDefaultActorSet,
} from "@/lib/architecture-creation-init";
import {
  ARCHITECTURE_DRAFT_STATUS_LABELS,
  architectureDraftDisplayName,
} from "@/lib/architecture-draft-status";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import { validateArchitectureReviewReadiness } from "@/lib/architecture-draft-readiness";
import {
  ARCHITECTURES_LIST_PATH,
  reviewDetailPath,
  startReviewFromArchitectureHref,
} from "@/lib/architecture-routes";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

type ArchitectureDraftWorkspaceProps = {
  readonly architectureId: string;
};

/** Long-lived architecture draft editor — save and resume without starting a review. */
export function ArchitectureDraftWorkspace(props: ArchitectureDraftWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRequestResponse | null>(null);
  const [fields, setFields] = useState({
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
  });
  const [actorSet, setActorSet] = useState<ActorSet>(() => architectureCreationDefaultActorSet());
  const [exitPending, setExitPending] = useState(false);

  const { saveState, lastSavedUtc, conflictMessage, saveDraft, reloadDraft } = useArchitectureDraftAutosave({
    architectureId: props.architectureId,
    fields,
    actorSet,
    onDraftLoaded: setDraft,
  });

  const hasUnsavedChanges = saveState === "unsaved" || saveState === "saving" || saveState === "error";
  useUnsavedChangesGuard({ when: hasUnsavedChanges });

  const displayName = useMemo(
    () => architectureDraftDisplayName(fields.systemName, fields.freeTextIntent),
    [fields.freeTextIntent, fields.systemName],
  );

  const linkedReviewId = draft?.spawnedRunId ?? null;
  const reviewReadiness = useMemo(() => validateArchitectureReviewReadiness(fields), [fields]);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const loaded = await getDraftRequest(props.architectureId);

      if (loaded.document.workflowIntent !== undefined && loaded.document.workflowIntent !== CREATE_ARCHITECTURE_INTENT) {
        // Draft exists but is not a create-architecture draft — still allow editing with create intent on save.
      }

      const formState = applyArchitectureCreationDraftToFormState(loaded);
      setDraft(loaded);
      setFields(formState);
      setActorSet(
        loaded.document.actorSet.actors.length > 0 ? loaded.document.actorSet : architectureCreationDefaultActorSet(),
      );
      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(loaded, {
          linkedReviewId: loaded.spawnedRunId ?? null,
        }),
      );
    } catch {
      setLoadError("Could not load this architecture draft.");
    } finally {
      setLoading(false);
    }
  }, [props.architectureId]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const handleSaveDraft = useCallback(async () => {
    const saved = await saveDraft();

    if (saved) {
      showSuccess("Architecture draft saved.");
    } else if (conflictMessage !== null) {
      showError("Architecture draft", conflictMessage);
    } else {
      showError("Architecture draft", "Could not save your architecture draft. Try again.");
    }
  }, [conflictMessage, saveDraft]);

  const handleSaveAndExit = useCallback(async () => {
    setExitPending(true);

    const saved = await saveDraft();

    if (!saved) {
      setExitPending(false);
      showError("Architecture draft", "Exit paused — save your changes before leaving this page.");

      return;
    }

    router.push(ARCHITECTURES_LIST_PATH);
  }, [router, saveDraft]);

  const handleStartReview = useCallback(async () => {
    if (!reviewReadiness.isValid) {
      showError(
        "Start architecture review",
        `Add ${reviewReadiness.blockers.join(" and ")} before starting a review.`,
      );

      return;
    }

    const saved = await saveDraft();

    if (!saved) {
      showError("Start architecture review", "Save the architecture draft before starting a review.");

      return;
    }

    upsertArchitectureDraftRegistryEntry(
      buildArchitectureDraftRegistryEntry(draft!, {
        customerStatus: "ready-for-review",
        linkedReviewId,
      }),
    );

    router.push(startReviewFromArchitectureHref(props.architectureId));
  }, [draft, linkedReviewId, props.architectureId, reviewReadiness, router, saveDraft]);

  if (loading) {
    return <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading architecture draft…</p>;
  }

  if (loadError !== null) {
    return (
      <div className="space-y-3">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {loadError}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadDraft()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="architecture-draft-workspace">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{displayName}</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
            Status: {ARCHITECTURE_DRAFT_STATUS_LABELS.draft}
            {linkedReviewId !== null ? (
              <>
                {" · "}
                <Link href={reviewDetailPath(linkedReviewId)} className="font-medium text-teal-800 underline dark:text-teal-300">
                  Open linked review
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <ArchitectureDraftSaveStatus saveState={saveState} lastSavedUtc={lastSavedUtc} />
      </div>

      {conflictMessage !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert" data-testid="architecture-draft-conflict">
          {conflictMessage}{" "}
          <button
            type="button"
            className="font-medium text-teal-800 underline dark:text-teal-300"
            onClick={() => {
              void reloadDraft();
            }}
          >
            Refresh draft
          </button>
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <ArchitectureDraftFormFields
            fields={fields}
            actorSet={actorSet}
            disabled={exitPending}
            onFieldsChange={setFields}
            onActorSetChange={setActorSet}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saveState === "saving" || !hasUnsavedChanges}
          onClick={() => {
            void handleSaveDraft();
          }}
          data-testid="architecture-save-draft"
        >
          Save draft
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saveState === "saving" || exitPending}
          onClick={() => {
            void handleSaveAndExit();
          }}
          data-testid="architecture-save-and-exit"
        >
          Save and exit
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={saveState === "saving" || linkedReviewId !== null}
          onClick={() => {
            void handleStartReview();
          }}
          data-testid="architecture-start-review"
        >
          {BUYER_START_ARCHITECTURE_REVIEW_CTA}
        </Button>
      </div>

      {!reviewReadiness.isValid ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Review readiness: add {reviewReadiness.blockers.join(" and ")} before starting a review.
        </p>
      ) : null}
    </div>
  );
}
