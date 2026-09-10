import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { persistIdleDeskRestoreBeforeSessionClear } from "@/lib/auth/idle-desk-restore";
import { isApiRequestError } from "@/lib/api-request-error";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

/** Legacy LP-19 sessionStorage key — migrated once into {@link LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY}. */
export const LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1 =
  "archlucid.session.livelihoodPendingMutation_v1" as const;

/** ADR 0089 / LW-051 — survives tab close during IdP redirect. */
export const LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY =
  "archlucid.livelihoodPendingMutation_v2" as const;

/** Cross-tab replay guard — stores the idempotency key currently being replayed. */
export const LIVELIHOOD_PENDING_MUTATION_REPLAY_CLAIM_KEY =
  "archlucid.livelihoodPendingMutationReplayClaim" as const;

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

function parseLivelihoodPendingMutationRaw(raw: string): LivelihoodPendingMutation | null {
  try {
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

/** One-time migration from LP-19 sessionStorage v1 into localStorage v2. */
export function migrateLivelihoodPendingMutationV1ToV2(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existingV2 = window.localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);

    if (existingV2 !== null && existingV2.trim().length > 0) {
      window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);

      return;
    }

    const rawV1 = window.sessionStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);

    if (rawV1 === null || rawV1.trim().length === 0) {
      return;
    }

    const parsed = parseLivelihoodPendingMutationRaw(rawV1);

    if (parsed === null) {
      window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);

      return;
    }

    window.localStorage.setItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY, JSON.stringify(parsed));
    window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);
  } catch {
    /* quota / private mode */
  }
}

export function readLivelihoodPendingMutation(): LivelihoodPendingMutation | null {
  if (typeof window === "undefined") {
    return null;
  }

  migrateLivelihoodPendingMutationV1ToV2();

  try {
    const raw = window.localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    return parseLivelihoodPendingMutationRaw(raw);
  } catch {
    return null;
  }
}

export function writeLivelihoodPendingMutation(mutation: LivelihoodPendingMutation): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    migrateLivelihoodPendingMutationV1ToV2();
    window.localStorage.setItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY, JSON.stringify(mutation));
    window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);
  } catch {
    /* quota / private mode */
  }
}

export function clearLivelihoodPendingMutation(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);
    window.sessionStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1);
  } catch {
    /* quota / private mode */
  }
}

export function clearLivelihoodPendingMutationReplayClaim(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_REPLAY_CLAIM_KEY);
  } catch {
    /* quota / private mode */
  }
}

function tryClaimLivelihoodPendingMutationReplay(idempotencyKey: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const existingClaim = window.localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_REPLAY_CLAIM_KEY);

    if (existingClaim === idempotencyKey) {
      return false;
    }

    window.localStorage.setItem(LIVELIHOOD_PENDING_MUTATION_REPLAY_CLAIM_KEY, idempotencyKey);

    return true;
  } catch {
    return false;
  }
}

/** Single-use read for the return path after session recovery. */
export function consumeLivelihoodPendingMutationForReturnPath(
  returnPath: string,
): LivelihoodPendingMutation | null {
  migrateLivelihoodPendingMutationV1ToV2();

  const normalizedReturnPath = normalizeReturnPath(returnPath);

  if (normalizedReturnPath === null || typeof window === "undefined") {
    return null;
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    // Claim synchronously so sibling tabs do not all replay the same POST.
    window.localStorage.removeItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);
  } catch {
    return null;
  }

  const pending = parseLivelihoodPendingMutationRaw(raw);
  const normalizedPendingPath = pending === null ? null : normalizeReturnPath(pending.returnPath);

  if (
    pending === null
    || normalizedPendingPath === null
    || normalizedReturnPath !== normalizedPendingPath
  ) {
    if (pending !== null) {
      writeLivelihoodPendingMutation(pending);
    }

    return null;
  }

  if (!tryClaimLivelihoodPendingMutationReplay(pending.idempotencyKey)) {
    writeLivelihoodPendingMutation(pending);

    return null;
  }

  return pending;
}

export function redirectToSessionExpiredForLivelihoodMutation(returnPath: string): void {
  const safeReturnPath = normalizeReturnPath(returnPath) ?? "/";

  window.location.assign(buildSessionExpiredHref(safeReturnPath));
}

export type WithLivelihood401ResumeInput<T> = {
  readonly kind: LivelihoodPendingMutationKind;
  readonly returnPath: string;
  readonly idempotencyKey: string;
  readonly payload: FindingDispositionPendingPayload | GovernanceMutationCorrectionPendingPayload;
  readonly execute: () => Promise<T>;
};

/**
 * Generic livelihood mutating-401 wrapper (ADR 0089 / LW-053).
 * On 401, persists idle desk restore + pending mutation, then navigates to session recovery.
 */
export async function withLivelihood401Resume<T>(
  input: WithLivelihood401ResumeInput<T>,
): Promise<T> {
  return executeIdempotentLivelihoodMutation(input);
}

export type ExecuteIdempotentLivelihoodMutationInput<T> = WithLivelihood401ResumeInput<T>;

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
    clearLivelihoodPendingMutationReplayClaim();

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
