import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { persistIdleDeskRestoreBeforeSessionClear } from "@/lib/auth/idle-desk-restore";
import { isApiRequestError } from "@/lib/api-request-error";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

export const LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY =
  "archlucid.session.livelihoodPendingMutation_v1" as const;

export type LivelihoodPendingMutationKind =
  | "finding_disposition"
  | "governance_mutation_correction";

export type FindingDispositionPendingPayload = {
  readonly findingId: string;
  readonly body: {
    readonly disposition: FindingDispositionKind;
    readonly rationale?: string;
    readonly runId: string;
    readonly revisitDueUtc?: string;
    readonly evidenceRequestText?: string;
    readonly tradeOffAcknowledgment?: string;
    readonly expectedCurrentDispositionRowVersionBase64?: string;
    readonly impactPreviewCompleted?: boolean;
    readonly previewOverrideReason?: string;
    readonly architectRestatement?: string;
  };
};

export type GovernanceMutationCorrectionPendingPayload = {
  readonly body: {
    readonly mutationKind: string;
    readonly subjectId: string;
    readonly runId: string;
    readonly rationale: string;
  };
};

export type LivelihoodPendingMutation = {
  readonly kind: LivelihoodPendingMutationKind;
  readonly idempotencyKey: string;
  readonly returnPath: string;
  readonly savedAtUtc: string;
  readonly requestLeftClient: boolean;
  readonly payload: FindingDispositionPendingPayload | GovernanceMutationCorrectionPendingPayload;
};

/** Thrown when a livelihood POST is redirecting to session recovery — not a user-visible failure. */
export class LivelihoodMutation401RedirectError extends Error {
  constructor() {
    super("Livelihood mutation redirecting for session recovery.");
    this.name = "LivelihoodMutation401RedirectError";
  }
}

export function isLivelihoodMutation401RedirectError(value: unknown): value is LivelihoodMutation401RedirectError {
  return value instanceof LivelihoodMutation401RedirectError;
}

function normalizeReturnPath(returnPath: string): string | null {
  const trimmed = returnPath.trim();

  if (!isSafeReturnPath(trimmed)) {
    return null;
  }

  return trimmed;
}

export function readLivelihoodPendingMutation(): LivelihoodPendingMutation | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LivelihoodPendingMutation>;
    const returnPath = normalizeReturnPath(parsed.returnPath ?? "");
    const idempotencyKey = String(parsed.idempotencyKey ?? "").trim();
    const kind = parsed.kind;

    if (
      returnPath === null
      || idempotencyKey.length === 0
      || (kind !== "finding_disposition" && kind !== "governance_mutation_correction")
      || parsed.payload === null
      || parsed.payload === undefined
    ) {
      return null;
    }

    return {
      kind,
      idempotencyKey,
      returnPath,
      savedAtUtc: String(parsed.savedAtUtc ?? new Date().toISOString()),
      requestLeftClient: parsed.requestLeftClient === true,
      payload: parsed.payload as
        FindingDispositionPendingPayload
        | GovernanceMutationCorrectionPendingPayload,
    };
  } catch {
    return null;
  }
}

export function writeLivelihoodPendingMutation(mutation: LivelihoodPendingMutation): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY, JSON.stringify(mutation));
  } catch {
    /* quota / private mode */
  }
}

export function clearLivelihoodPendingMutation(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
}

/** Single-use read for the return path after session recovery. */
export function consumeLivelihoodPendingMutationForReturnPath(
  returnPath: string,
): LivelihoodPendingMutation | null {
  const pending = readLivelihoodPendingMutation();
  const normalizedReturnPath = normalizeReturnPath(returnPath);
  const normalizedPendingPath = pending === null ? null : normalizeReturnPath(pending.returnPath);

  if (
    pending === null
    || normalizedReturnPath === null
    || normalizedPendingPath === null
    || normalizedReturnPath !== normalizedPendingPath
  ) {
    return null;
  }

  clearLivelihoodPendingMutation();

  return pending;
}

export function redirectToSessionExpiredForLivelihoodMutation(returnPath: string): void {
  const safeReturnPath = normalizeReturnPath(returnPath) ?? "/";

  window.location.assign(buildSessionExpiredHref(safeReturnPath));
}

export type ExecuteIdempotentLivelihoodMutationInput<T> = {
  readonly kind: LivelihoodPendingMutationKind;
  readonly returnPath: string;
  readonly idempotencyKey: string;
  readonly payload: FindingDispositionPendingPayload | GovernanceMutationCorrectionPendingPayload;
  readonly execute: () => Promise<T>;
};

/**
 * Runs one idempotent livelihood POST. On 401, persists idle desk restore + pending mutation,
 * then navigates to `/auth/session-expired` for a single replay after re-auth (LP-19).
 */
export async function executeIdempotentLivelihoodMutation<T>(
  input: ExecuteIdempotentLivelihoodMutationInput<T>,
): Promise<T> {
  const safeReturnPath = normalizeReturnPath(input.returnPath);

  if (safeReturnPath === null) {
    return input.execute();
  }

  try {
    const result = await input.execute();

    clearLivelihoodPendingMutation();

    return result;
  } catch (error: unknown) {
    if (!isApiRequestError(error) || error.httpStatus !== 401) {
      throw error;
    }

    persistIdleDeskRestoreBeforeSessionClear(safeReturnPath);
    writeLivelihoodPendingMutation({
      kind: input.kind,
      idempotencyKey: input.idempotencyKey,
      returnPath: safeReturnPath,
      savedAtUtc: new Date().toISOString(),
      requestLeftClient: true,
      payload: input.payload,
    });
    redirectToSessionExpiredForLivelihoodMutation(safeReturnPath);
    throw new LivelihoodMutation401RedirectError();
  }
}
