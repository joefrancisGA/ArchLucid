import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";

export type SecureNowQuestion = {
  readonly dispositionId: string | null;
  readonly snapshotId: string;
  readonly subscriptionId: string | null;
  readonly resourceId: string | null;
  readonly questionKey: string | null;
  readonly source: string | null;
  readonly scopeKind: string | null;
  readonly status: string | null;
  readonly questionText: string;
  readonly resourceType: string | null;
  readonly resourceName: string | null;
  readonly reasonText: string;
  readonly sourceLine: string;
  readonly answerCodes: readonly string[] | null;
  readonly evidenceFingerprint: string | null;
  readonly expirationUtc: string | null;
  readonly isExpired: boolean | null;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string | null;
};

export type SecureNowQuestionWrite = {
  readonly subscriptionId: string | null;
  readonly resourceId: string;
  readonly questionKey: string;
  readonly source: string;
  readonly scopeKind: string;
  readonly answerCode?: string | null;
  readonly answerText?: string | null;
  readonly reason: string;
  readonly expirationUtc?: string | null;
  readonly evidenceFingerprint: string;
};

export type SecureNowQuestionReopen = {
  readonly subscriptionId: string | null;
  readonly resourceId: string;
  readonly questionKey: string;
  readonly reason: string;
};

export type SecureNowQuestionDispositionAudit = {
  readonly action: string;
  readonly actorKey: string;
  readonly occurredUtc: string;
  readonly reason: string;
};

export type SecureNowQuestionDisposition = {
  readonly dispositionId: string;
  readonly snapshotId: string;
  readonly subscriptionId: string;
  readonly resourceId: string;
  readonly questionKey: string;
  readonly source: string;
  readonly scopeKind: string;
  readonly status: string;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string;
  readonly expirationUtc: string;
  readonly isExpired: boolean;
  readonly evidenceFingerprint: string;
  readonly actorKey: string;
  readonly updatedUtc: string;
  readonly auditEntries: readonly SecureNowQuestionDispositionAudit[];
};

function stringOrDefault(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapDispositionRequiredString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function mapListedOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseJsonBooleanOrNull(value: unknown): boolean | null {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  return null;
}

function mapJsonBoolean(value: unknown): boolean {
  return parseJsonBooleanOrNull(value) === true;
}

function mapJsonBooleanOrNull(value: unknown): boolean | null {
  return parseJsonBooleanOrNull(value);
}

/** Whether a listed question's snapshot id matches the active queue context after trim. */
export function secureNowQuestionListedSnapshotMatchesContext(
  listedSnapshotId: string,
  contextSnapshotId: string,
): boolean {
  const listed = listedSnapshotId.trim();
  const context = contextSnapshotId.trim();

  if (listed.length === 0) {
    return false;
  }

  return listed === context;
}

export const secureNowQuestionDispositionResponseRequiredStringFields = [
  "dispositionId",
  "snapshotId",
  "subscriptionId",
  "questionKey",
  "evidenceFingerprint",
  "source",
  "scopeKind",
  "status",
] as const satisfies readonly (keyof SecureNowQuestionDisposition)[];

export function secureNowQuestionDispositionResponseIsUsable(
  disposition: SecureNowQuestionDisposition,
): boolean {
  return secureNowQuestionDispositionResponseRequiredStringFields.every(
    (field) => disposition[field].length > 0,
  );
}

export function mapSecureNowQuestionDisposition(raw: Record<string, unknown>): SecureNowQuestionDisposition {
  return {
    dispositionId: mapDispositionRequiredString(raw.dispositionId),
    snapshotId: mapDispositionRequiredString(raw.snapshotId),
    subscriptionId: mapDispositionRequiredString(raw.subscriptionId),
    resourceId: mapDispositionRequiredString(raw.resourceId),
    questionKey: mapDispositionRequiredString(raw.questionKey),
    source: mapDispositionRequiredString(raw.source),
    scopeKind: mapDispositionRequiredString(raw.scopeKind),
    status: mapDispositionRequiredString(raw.status),
    answerCode: mapListedOptionalString(raw.answerCode),
    answerText: mapListedOptionalString(raw.answerText),
    reason: mapDispositionRequiredString(raw.reason),
    expirationUtc: mapDispositionRequiredString(raw.expirationUtc),
    isExpired: mapJsonBoolean(raw.isExpired),
    evidenceFingerprint: mapDispositionRequiredString(raw.evidenceFingerprint),
    actorKey: mapDispositionRequiredString(raw.actorKey),
    updatedUtc: mapDispositionRequiredString(raw.updatedUtc),
    auditEntries: Array.isArray(raw.auditEntries)
      ? raw.auditEntries.map((entry) => {
          const audit = (entry ?? {}) as Record<string, unknown>;
          return {
            action: mapDispositionRequiredString(audit.action),
            actorKey: mapDispositionRequiredString(audit.actorKey),
            occurredUtc: mapDispositionRequiredString(audit.occurredUtc),
            reason: mapDispositionRequiredString(audit.reason),
          };
        })
      : [],
  };
}

function mapQuestion(raw: Record<string, unknown>): SecureNowQuestion {
  const questionText = stringOrDefault(raw.questionText);

  return {
    dispositionId: mapListedOptionalString(raw.dispositionId),
    snapshotId: typeof raw.snapshotId === "string" ? raw.snapshotId.trim() : "",
    subscriptionId: mapListedOptionalString(raw.subscriptionId),
    resourceId: mapListedOptionalString(raw.resourceId),
    questionKey: mapListedOptionalString(raw.questionKey),
    source: mapListedOptionalString(raw.source),
    scopeKind: mapListedOptionalString(raw.scopeKind),
    status: typeof raw.status === "string"
      ? (() => {
        const trimmed = raw.status.trim();
        return trimmed.length > 0 ? trimmed : null;
      })()
      : null,
    questionText: questionText.length > 0 ? questionText : "Question text was not stored",
    resourceType: mapListedOptionalString(raw.resourceType),
    resourceName: mapListedOptionalString(raw.resourceName),
    reasonText: stringOrDefault(raw.reasonText),
    sourceLine: stringOrDefault(raw.sourceLine),
    answerCodes: Array.isArray(raw.answerCodes)
      ? raw.answerCodes
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
      : null,
    evidenceFingerprint: mapListedOptionalString(raw.evidenceFingerprint),
    expirationUtc: mapListedOptionalString(raw.expirationUtc),
    isExpired: mapJsonBooleanOrNull(raw.isExpired),
    answerCode: mapListedOptionalString(raw.answerCode),
    answerText: mapListedOptionalString(raw.answerText),
    reason: mapListedOptionalString(raw.reason),
  };
}

function questionPath(snapshotId: string): string {
  return `/api/proxy/v1/infra-evidence/snapshots/${encodeURIComponent(snapshotId)}/questions`;
}

export async function listSecureNowQuestions(snapshotId: string): Promise<SecureNowQuestion[]> {
  const raw = await proxyJsonGet<unknown>(questionPath(snapshotId));
  return Array.isArray(raw)
    ? raw.map((item) => mapQuestion((item ?? {}) as Record<string, unknown>))
    : [];
}

async function postSecureNowQuestionDisposition(
  path: string,
  request: SecureNowQuestionWrite | SecureNowQuestionReopen,
): Promise<SecureNowQuestionDisposition | undefined> {
  const raw = await proxyJsonPost<unknown>(path, request);

  if (raw === null || raw === undefined) {
    return undefined;
  }

  const disposition = mapSecureNowQuestionDisposition((raw ?? {}) as Record<string, unknown>);
  return secureNowQuestionDispositionResponseIsUsable(disposition) ? disposition : undefined;
}

export function answerSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(`${questionPath(snapshotId)}/answer`, request);
}

export function ignoreSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(`${questionPath(snapshotId)}/ignore`, request);
}

export function reopenSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionReopen,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(`${questionPath(snapshotId)}/reopen`, request);
}
