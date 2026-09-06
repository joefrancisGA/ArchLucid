import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";
import { applyArchitectureCreationDraftToFormState } from "@/lib/architecture/architecture-creation-init";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";
import { mergeScopeBulletsIntoBrief } from "@/lib/architecture/architecture-scope-understanding-check";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

/** `idle` = loaded / pristine — do not show "Saved" until a user-driven persist succeeds. */
export type ArchitectureDraftSaveState = "idle" | "saved" | "saving" | "unsaved" | "error" | "offline";

export const ARCHITECTURE_DRAFT_AUTOSAVE_DEBOUNCE_MS = 1500;

export type ArchitectureDraftCreatedPayload = {
  readonly draftId: string;
  readonly architectureId: string;
};

export type UseArchitectureDraftAutosaveArgs = {
  readonly draftId: string;
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly enabled?: boolean;
  /** When true, skip server writes until the operator enters saveable field content. */
  readonly deferCreateUntilFirstSave?: boolean;
  readonly scopeGateOpen?: boolean;
  readonly scopeBullets?: readonly ScopeUnderstandingBullet[];
  readonly onDraftCreated?: (created: ArchitectureDraftCreatedPayload) => void;
  readonly onDraftLoaded?: (draft: DraftRequestResponse) => void;
  /** Called when GET shows a non-drafting status — do not treat as another-session conflict. */
  readonly onImmutableDraftDetected?: (draft: DraftRequestResponse) => void;
  /** Hydrate a new-draft session from this-browser offline recovery (AD-04). */
  readonly onNewDraftRecoveryHydrated?: (snapshot: {
    readonly fields: ArchitectureDraftFieldState;
    readonly actorSet: ActorSet;
  }) => void;
};

export type UseArchitectureDraftAutosaveResult = {
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
  readonly conflictMessage: string | null;
  readonly saveDraft: () => Promise<boolean>;
  readonly markDirty: () => void;
  readonly reloadDraft: () => Promise<void>;
  /**
   * Align the autosave baseline with form state already applied from the server (initial load).
   * Prevents a spurious post-load PATCH that can race with later edits.
   */
  readonly acceptServerBaseline: (
    fields: ArchitectureDraftFieldState,
    serverUpdatedUtc: string,
    actorSet: ActorSet,
  ) => void;
  /** Align revision tracking after a PATCH from outside this hook (e.g. scope confirmation). */
  readonly syncServerUpdatedUtc: (serverUpdatedUtc: string) => void;
  readonly hasPersistedDraft: boolean;
  /** LK-12: overwrite server copy with this tab's unsaved edits after a conflict. */
  readonly keepLocalDraftOnConflict: () => Promise<boolean>;
};

export function fieldsAreEqual(left: ArchitectureDraftFieldState, right: ArchitectureDraftFieldState): boolean {
  return (
    left.freeTextIntent === right.freeTextIntent &&
    left.businessOutcome === right.businessOutcome &&
    left.systemName === right.systemName &&
    JSON.stringify(left.structuredBrief) === JSON.stringify(right.structuredBrief)
  );
}

export function actorSetsAreEqual(left: ActorSet, right: ActorSet): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function fieldsFromDraftDocument(draft: DraftRequestResponse): ArchitectureDraftFieldState {
  return applyArchitectureCreationDraftToFormState(draft);
}

export function isNonRetryableDraftPatchError(error: unknown): boolean {
  return isApiRequestError(error) && (error.httpStatus === 400 || error.httpStatus === 409);
}

export function createIntentForDeferredDraft(
  fields: ArchitectureDraftFieldState,
  confirmedScopeBullets?: readonly ScopeUnderstandingBullet[],
): string {
  const strippedIntent = fields.freeTextIntent.trim();
  const intentForServer =
    confirmedScopeBullets !== undefined && confirmedScopeBullets.length > 0
      ? mergeScopeBulletsIntoBrief(confirmedScopeBullets, strippedIntent).trim()
      : strippedIntent;

  if (intentForServer.length > 0) {
    return intentForServer;
  }

  return ARCHITECTURE_CREATION_BOOTSTRAP_INTENT;
}
