import {
  ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
  isArchitectureCreationBootstrapIntent,
} from "@/lib/architecture/architecture-creation-bootstrap";
import { buildArchitectureCreationQuestionSelection } from "@/lib/architecture/architecture-creation-question-definition";
import {
  emitArchitectureCreationInitTelemetry,
  markArchitectureCreationPhase,
  measureArchitectureCreationPhase,
  type ArchitectureCreationInitTimings,
} from "@/lib/architecture/architecture-creation-init-telemetry";
import {
  clearArchitectureCreationDraftId,
  readArchitectureCreationDraftId,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture/architecture-creation-session";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { stripScopeUnderstandingSection } from "@/lib/architecture/architecture-scope-understanding-check";
import {
  emptyArchitectureDraftStructuredBrief,
  structuredBriefFromDocument,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { buildDefaultActorSet, createDraftRequest, getDraftRequest } from "@/lib/api/draft-intake-api";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";
import type { DraftRequestResponse } from "@/types/draft-intake";

export type ArchitectureCreationInitResult = {
  readonly draftId: string | null;
  readonly draft: DraftRequestResponse | null;
  readonly questionSelection: ReturnType<typeof buildArchitectureCreationQuestionSelection>;
  readonly timings: ArchitectureCreationInitTimings;
  /** Pre-release diagnostic text when draft restore/create failed; null on success. */
  readonly failureDetail: string | null;
};

let inFlightInit: Promise<ArchitectureCreationInitResult> | null = null;

/** Test-only reset for module-level init deduplication. */
export function resetArchitectureCreationInitForTests(): void {
  inFlightInit = null;
}

function loadStaticQuestionSelection() {
  const startedAt = performance.now();
  const selection = buildArchitectureCreationQuestionSelection();
  const timings: ArchitectureCreationInitTimings = {};
  markArchitectureCreationPhase("question-definition", timings, startedAt);

  return { selection, timings };
}

function registerArchitectureDraft(draft: DraftRequestResponse): void {
  upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(draft));
}

type RestoreOrCreateDraftOutcome = {
  readonly draft: DraftRequestResponse | null;
  readonly failureDetail: string | null;
};

async function restoreOrCreateDraft(timings: ArchitectureCreationInitTimings): Promise<RestoreOrCreateDraftOutcome> {
  const existingDraftId = readArchitectureCreationDraftId();

  if (existingDraftId !== null) {
    try {
      const restored = await measureArchitectureCreationPhase("draft-restore", timings, async () =>
        getDraftRequest(existingDraftId),
      );
      registerArchitectureDraft(restored);

      return { draft: restored, failureDetail: null };
    } catch {
      clearArchitectureCreationDraftId();
    }
  }

  try {
    const created = await measureArchitectureCreationPhase("draft-create", timings, async () =>
      createDraftRequest(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, CREATE_ARCHITECTURE_INTENT),
    );
    writeArchitectureCreationDraftId(created.draftId);
    registerArchitectureDraft(created);

    return { draft: created, failureDetail: null };
  } catch (error) {
    return {
      draft: null,
      failureDetail: formatVerboseApiFailureMessage(error, CREATE_ARCHITECTURE_DRAFT_START_FAILED_MESSAGE),
    };
  }
}

/** Idempotent architecture draft restore/create plus synchronous question definition load. */
export async function initializeArchitectureCreation(): Promise<ArchitectureCreationInitResult> {
  if (inFlightInit !== null) {
    return inFlightInit;
  }

  const totalStartedAt = performance.now();
  const timings: ArchitectureCreationInitTimings = {};
  const { selection: staticSelection, timings: staticTimings } = loadStaticQuestionSelection();
  Object.assign(timings, staticTimings);

  inFlightInit = (async () => {
    const outcome = await restoreOrCreateDraft(timings);
    timings.total = Math.round(performance.now() - totalStartedAt);
    emitArchitectureCreationInitTelemetry(timings, outcome.draft === null ? "failed" : "ready");

    return {
      draftId: outcome.draft?.draftId ?? null,
      draft: outcome.draft,
      questionSelection: staticSelection,
      timings,
      failureDetail: outcome.failureDetail,
    };
  })();

  try {
    return await inFlightInit;
  } finally {
    inFlightInit = null;
  }
}

export function applyArchitectureCreationDraftToFormState(draft: DraftRequestResponse | null): {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly structuredBrief: ReturnType<typeof structuredBriefFromDocument>;
} {
  if (draft === null || isArchitectureCreationBootstrapIntent(draft.document.freeTextIntent)) {
    return {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
    };
  }

  // Drafts saved before the scope block moved out of the form fields can still carry it inline.
  return {
    freeTextIntent: stripScopeUnderstandingSection(draft.document.freeTextIntent),
    businessOutcome: stripScopeUnderstandingSection(draft.document.businessOutcome),
    systemName: draft.document.systemName ?? "",
    structuredBrief: structuredBriefFromDocument(draft.document),
  };
}

export function architectureCreationDefaultActorSet(): ReturnType<typeof buildDefaultActorSet> {
  return buildDefaultActorSet();
}
