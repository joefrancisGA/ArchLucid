import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";
import {
  readWizardSessionSnapshot,
  WIZARD_SESSION_IDS,
  wizardSessionHasTextContent,
  clearWizardSessionSnapshot,
  type WizardSessionId,
  type WizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

export const ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT =
  "archlucid:reviews-new-wizard-continue" as const;

export const REVIEWS_NEW_WIZARD_AUTO_RESTORE_STORAGE_KEY =
  "archlucid:reviews-new-wizard-auto-restore" as const;

export const REVIEWS_NEW_WIZARD_RESUME_STRIP_DISMISSED_STORAGE_KEY =
  "archlucid:reviews-new-wizard-resume-strip-dismissed" as const;

export type ReviewsNewResumableWizardSession = {
  readonly wizardId: WizardSessionId;
  readonly pathMode: ReviewsNewPathMode;
  readonly savedAtUtc: string;
  readonly stepIndex: number;
};

const REVIEWS_NEW_WIZARD_PATH_MODES: Record<
  WizardSessionId,
  ReviewsNewPathMode | null
> = {
  [WIZARD_SESSION_IDS.reviewsNewQuickStart]: "quick-review",
  [WIZARD_SESSION_IDS.reviewsNewGuidedQuestions]: "guided-intake",
  [WIZARD_SESSION_IDS.reviewsNewTemplates]: "detailed",
  [WIZARD_SESSION_IDS.pilotBaseline]: null,
  [WIZARD_SESSION_IDS.adminSsoWizard]: null,
};

const REVIEWS_NEW_WIZARD_IDS: readonly WizardSessionId[] = [
  WIZARD_SESSION_IDS.reviewsNewQuickStart,
  WIZARD_SESSION_IDS.reviewsNewGuidedQuestions,
  WIZARD_SESSION_IDS.reviewsNewTemplates,
];

type QuickStartWizardState = {
  readonly runTitle?: string;
  readonly briefText?: string;
};

type TemplatesWizardState = {
  readonly systemName?: string;
  readonly description?: string;
};

type GuidedIntakeWizardState = {
  readonly freeTextIntent?: string;
  readonly businessOutcome?: string;
  readonly systemName?: string;
  readonly draftId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function reviewsNewQuickStartHasSaveableContent(
  state: unknown,
  stepIndex: number,
): boolean {
  if (!isRecord(state)) {
    return false;
  }

  const quickStart = state as QuickStartWizardState;

  return (
    wizardSessionHasTextContent(quickStart.runTitle) ||
    wizardSessionHasTextContent(quickStart.briefText)
  );
}

export function reviewsNewTemplatesHasSaveableContent(
  state: unknown,
  stepIndex: number,
): boolean {
  if (!isRecord(state)) {
    return false;
  }

  const templates = state as TemplatesWizardState;

  return (
    stepIndex > 0 ||
    wizardSessionHasTextContent(templates.systemName) ||
    wizardSessionHasTextContent(templates.description)
  );
}

export function reviewsNewGuidedIntakeHasSaveableContent(
  state: unknown,
  stepIndex: number,
): boolean {
  if (!isRecord(state)) {
    return false;
  }

  const guided = state as GuidedIntakeWizardState;

  return (
    stepIndex > 0 ||
    wizardSessionHasTextContent(guided.freeTextIntent) ||
    wizardSessionHasTextContent(guided.businessOutcome) ||
    wizardSessionHasTextContent(guided.systemName) ||
    (guided.draftId !== null && guided.draftId !== undefined && guided.draftId.trim().length > 0)
  );
}

export function reviewsNewWizardHasSaveableContent(
  wizardId: WizardSessionId,
  state: unknown,
  stepIndex: number,
): boolean {
  switch (wizardId) {
    case WIZARD_SESSION_IDS.reviewsNewQuickStart:
      return reviewsNewQuickStartHasSaveableContent(state, stepIndex);

    case WIZARD_SESSION_IDS.reviewsNewTemplates:
      return reviewsNewTemplatesHasSaveableContent(state, stepIndex);

    case WIZARD_SESSION_IDS.reviewsNewGuidedQuestions:
      return reviewsNewGuidedIntakeHasSaveableContent(state, stepIndex);

    default:
      return false;
  }
}

function toResumableSession(
  wizardId: WizardSessionId,
  snapshot: WizardSessionSnapshot<unknown>,
): ReviewsNewResumableWizardSession | null {
  const pathMode = REVIEWS_NEW_WIZARD_PATH_MODES[wizardId];

  if (pathMode === null) {
    return null;
  }

  if (!reviewsNewWizardHasSaveableContent(wizardId, snapshot.state, snapshot.stepIndex)) {
    return null;
  }

  return {
    wizardId,
    pathMode,
    savedAtUtc: snapshot.savedAtUtc,
    stepIndex: snapshot.stepIndex,
  };
}

/** Most recently saved resumable new-review wizard session in this browser scope. */
export function findResumableReviewsNewWizardSession(): ReviewsNewResumableWizardSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  let best: ReviewsNewResumableWizardSession | null = null;

  for (const wizardId of REVIEWS_NEW_WIZARD_IDS) {
    const snapshot = readWizardSessionSnapshot<unknown>(wizardId);

    if (snapshot === null) {
      continue;
    }

    const resumable = toResumableSession(wizardId, snapshot);

    if (resumable === null) {
      continue;
    }

    if (best === null || resumable.savedAtUtc.localeCompare(best.savedAtUtc) > 0) {
      best = resumable;
    }
  }

  return best;
}

export function reviewsNewWizardResumeHref(pathMode: ReviewsNewPathMode): string {
  return `/architecture/reviews/new?path=${pathMode}`;
}

/** True when the current `path` query already shows the wizard for this resume target. */
export function reviewsNewWizardPathIsActive(
  pathQuery: string,
  pathMode: ReviewsNewPathMode,
): boolean {
  const normalizedPath = pathQuery.trim().toLowerCase();

  if (normalizedPath.length === 0) {
    return pathMode === "quick-review";
  }

  return normalizedPath === pathMode;
}

export function requestReviewsNewWizardAutoRestore(wizardId: WizardSessionId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(REVIEWS_NEW_WIZARD_AUTO_RESTORE_STORAGE_KEY, wizardId);
}

export function dispatchReviewsNewWizardContinueRequested(wizardId: WizardSessionId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ wizardId: WizardSessionId }>(ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT, {
      detail: { wizardId },
    }),
  );
}

export function consumeReviewsNewWizardAutoRestore(wizardId: WizardSessionId): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.sessionStorage.getItem(REVIEWS_NEW_WIZARD_AUTO_RESTORE_STORAGE_KEY)?.trim() ?? "";

  if (stored !== wizardId) {
    return false;
  }

  window.sessionStorage.removeItem(REVIEWS_NEW_WIZARD_AUTO_RESTORE_STORAGE_KEY);

  return true;
}

type DismissedResumeStrip = {
  readonly wizardId: WizardSessionId;
  readonly savedAtUtc: string;
};

function readDismissedResumeStrip(): DismissedResumeStrip | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_NEW_WIZARD_RESUME_STRIP_DISMISSED_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DismissedResumeStrip>;

    if (
      typeof parsed.wizardId !== "string" ||
      typeof parsed.savedAtUtc !== "string" ||
      parsed.savedAtUtc.trim().length === 0
    ) {
      return null;
    }

    return {
      wizardId: parsed.wizardId as WizardSessionId,
      savedAtUtc: parsed.savedAtUtc,
    };
  } catch {
    return null;
  }
}

export function isReviewsNewWizardResumeStripDismissed(
  session: ReviewsNewResumableWizardSession,
): boolean {
  const dismissed = readDismissedResumeStrip();

  if (dismissed === null) {
    return false;
  }

  return (
    dismissed.wizardId === session.wizardId && dismissed.savedAtUtc === session.savedAtUtc
  );
}

export function dismissReviewsNewWizardResumeStrip(session: ReviewsNewResumableWizardSession): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: DismissedResumeStrip = {
    wizardId: session.wizardId,
    savedAtUtc: session.savedAtUtc,
  };

  window.localStorage.setItem(
    REVIEWS_NEW_WIZARD_RESUME_STRIP_DISMISSED_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function clearResumableReviewsNewWizardSession(wizardId: WizardSessionId): void {
  clearWizardSessionSnapshot(wizardId);
}
