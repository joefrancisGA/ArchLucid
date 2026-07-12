import {
  ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
  isArchitectureCreationBootstrapIntent,
} from "@/lib/architecture-creation-bootstrap";
import { buildArchitectureCreationQuestionSelection } from "@/lib/architecture-creation-question-definition";
import {
  emitArchitectureCreationInitTelemetry,
  markArchitectureCreationPhase,
  measureArchitectureCreationPhase,
  type ArchitectureCreationInitTimings,
} from "@/lib/architecture-creation-init-telemetry";
import {
  clearArchitectureCreationDraftId,
  readArchitectureCreationDraftId,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture-creation-session";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { buildDefaultActorSet, createDraftRequest, getDraftRequest } from "@/lib/api/draft-intake-api";
import type { DraftRequestResponse } from "@/types/draft-intake";

export type ArchitectureCreationInitResult = {
  readonly draftId: string | null;
  readonly draft: DraftRequestResponse | null;
  readonly questionSelection: ReturnType<typeof buildArchitectureCreationQuestionSelection>;
  readonly timings: ArchitectureCreationInitTimings;
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

async function restoreOrCreateDraft(timings: ArchitectureCreationInitTimings): Promise<DraftRequestResponse | null> {
  const existingDraftId = readArchitectureCreationDraftId();

  if (existingDraftId !== null) {
    try {
      return await measureArchitectureCreationPhase("draft-restore", timings, async () =>
        getDraftRequest(existingDraftId),
      );
    } catch {
      clearArchitectureCreationDraftId();
    }
  }

  try {
    const created = await measureArchitectureCreationPhase("draft-create", timings, async () =>
      createDraftRequest(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, CREATE_ARCHITECTURE_INTENT),
    );
    writeArchitectureCreationDraftId(created.draftId);

    return created;
  } catch {
    return null;
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
    const draft = await restoreOrCreateDraft(timings);
    timings.total = Math.round(performance.now() - totalStartedAt);
    emitArchitectureCreationInitTelemetry(timings, draft === null ? "failed" : "ready");

    return {
      draftId: draft?.draftId ?? null,
      draft,
      questionSelection: staticSelection,
      timings,
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
} {
  if (draft === null || isArchitectureCreationBootstrapIntent(draft.document.freeTextIntent)) {
    return {
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
    };
  }

  return {
    freeTextIntent: draft.document.freeTextIntent,
    businessOutcome: draft.document.businessOutcome ?? "",
    systemName: draft.document.systemName ?? "",
  };
}

export function architectureCreationDefaultActorSet(): ReturnType<typeof buildDefaultActorSet> {
  return buildDefaultActorSet();
}
