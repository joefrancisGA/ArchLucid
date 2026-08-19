import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export const WIZARD_SESSION_PERSISTENCE_VERSION = 1 as const;

export const WIZARD_SESSION_IDS = {
  reviewsNewTemplates: "reviews-new-templates",
  reviewsNewQuickStart: "reviews-new-quick-start",
  reviewsNewGuidedQuestions: "reviews-new-guided-questions",
  pilotBaseline: "pilot-baseline",
  adminSsoWizard: "admin-sso-wizard",
} as const;

export type WizardSessionId = (typeof WIZARD_SESSION_IDS)[keyof typeof WIZARD_SESSION_IDS];

export type WizardSessionSnapshot<TState> = {
  readonly v: typeof WIZARD_SESSION_PERSISTENCE_VERSION;
  readonly stepIndex: number;
  readonly state: TState;
  readonly savedAtUtc: string;
};

export function buildWizardSessionStorageKey(wizardId: WizardSessionId): string {
  const scope = readOperatorScopeFromStorage();
  const tenantId = scope?.tenantId?.trim() || "anonymous";
  const workspaceId = scope?.workspaceId?.trim() || "default";

  return `archlucid:wizard-session:v${WIZARD_SESSION_PERSISTENCE_VERSION}:${wizardId}:${tenantId}:${workspaceId}`;
}

export function readWizardSessionSnapshot<TState>(wizardId: WizardSessionId): WizardSessionSnapshot<TState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(buildWizardSessionStorageKey(wizardId));

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const snapshot = parsed as Partial<WizardSessionSnapshot<TState>>;

    if (snapshot.v !== WIZARD_SESSION_PERSISTENCE_VERSION) {
      return null;
    }

    if (typeof snapshot.stepIndex !== "number" || !Number.isFinite(snapshot.stepIndex)) {
      return null;
    }

    if (snapshot.state === undefined || typeof snapshot.savedAtUtc !== "string") {
      return null;
    }

    return {
      v: WIZARD_SESSION_PERSISTENCE_VERSION,
      stepIndex: snapshot.stepIndex,
      state: snapshot.state,
      savedAtUtc: snapshot.savedAtUtc,
    };
  } catch {
    return null;
  }
}

export function writeWizardSessionSnapshot<TState>(
  wizardId: WizardSessionId,
  input: {
    readonly stepIndex: number;
    readonly state: TState;
  },
): string {
  const savedAtUtc = new Date().toISOString();
  const snapshot: WizardSessionSnapshot<TState> = {
    v: WIZARD_SESSION_PERSISTENCE_VERSION,
    stepIndex: input.stepIndex,
    state: input.state,
    savedAtUtc,
  };

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(buildWizardSessionStorageKey(wizardId), JSON.stringify(snapshot));
  }

  return savedAtUtc;
}

export function clearWizardSessionSnapshot(wizardId: WizardSessionId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(buildWizardSessionStorageKey(wizardId));
}

export function wizardSessionHasTextContent(value: string | null | undefined): boolean {
  return (value?.trim().length ?? 0) > 0;
}
