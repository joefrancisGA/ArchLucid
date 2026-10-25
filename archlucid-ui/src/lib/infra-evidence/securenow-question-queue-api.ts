import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";

export type SecureNowQuestion = {
  readonly dispositionId: string | null;
  readonly snapshotId: string;
  readonly subscriptionId: string | null;
  readonly resourceId: string | null;
  readonly questionKey: string;
  readonly source: string | null;
  readonly scopeKind: string | null;
  readonly status: string | null;
  readonly questionText: string;
  readonly resourceType: string | null;
  readonly resourceName: string | null;
  readonly reasonText: string;
  readonly sourceLine: string;
  readonly answerCodes: readonly string[] | null;
  readonly evidenceFingerprint: string;
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

export function mapSecureNowQuestionDisposition(raw: Record<string, unknown>): SecureNowQuestionDisposition {
  return {
    dispositionId: stringOrDefault(raw.dispositionId),
    snapshotId: stringOrDefault(raw.snapshotId),
    subscriptionId: stringOrDefault(raw.subscriptionId),
    resourceId: stringOrDefault(raw.resourceId),
    questionKey: stringOrDefault(raw.questionKey),
    source: stringOrDefault(raw.source),
    scopeKind: stringOrDefault(raw.scopeKind),
    status: stringOrDefault(raw.status),
    answerCode: typeof raw.answerCode === "string" ? raw.answerCode : null,
    answerText: typeof raw.answerText === "string" ? raw.answerText : null,
    reason: stringOrDefault(raw.reason),
    expirationUtc: stringOrDefault(raw.expirationUtc),
    isExpired: raw.isExpired === true,
    evidenceFingerprint: stringOrDefault(raw.evidenceFingerprint),
    actorKey: stringOrDefault(raw.actorKey),
    updatedUtc: stringOrDefault(raw.updatedUtc),
    auditEntries: Array.isArray(raw.auditEntries)
      ? raw.auditEntries.map((entry) => {
          const audit = (entry ?? {}) as Record<string, unknown>;
          return {
            action: stringOrDefault(audit.action),
            actorKey: stringOrDefault(audit.actorKey),
            occurredUtc: stringOrDefault(audit.occurredUtc),
            reason: stringOrDefault(audit.reason),
          };
        })
      : [],
  };
}

function mapQuestion(raw: Record<string, unknown>): SecureNowQuestion {
  const questionText = stringOrDefault(raw.questionText).trim();

  return {
    dispositionId: typeof raw.dispositionId === "string" ? raw.dispositionId : null,
    snapshotId: stringOrDefault(raw.snapshotId),
    subscriptionId: typeof raw.subscriptionId === "string"
      ? raw.subscriptionId
      : null,
    resourceId: raw.resourceId === null || raw.resourceId === undefined ? null : stringOrDefault(raw.resourceId),
    questionKey: stringOrDefault(raw.questionKey),
    source: typeof raw.source === "string" ? raw.source : null,
    scopeKind: typeof raw.scopeKind === "string" ? raw.scopeKind : null,
    status: typeof raw.status === "string" ? raw.status : null,
    questionText: questionText.length > 0 ? questionText : "Question text was not stored",
    resourceType: typeof raw.resourceType === "string" ? raw.resourceType : null,
    resourceName: typeof raw.resourceName === "string" ? raw.resourceName : null,
    reasonText: stringOrDefault(raw.reasonText),
    sourceLine: stringOrDefault(raw.sourceLine),
    answerCodes: Array.isArray(raw.answerCodes)
      ? raw.answerCodes.filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        )
      : null,
    evidenceFingerprint: stringOrDefault(raw.evidenceFingerprint),
    expirationUtc: typeof raw.expirationUtc === "string" ? raw.expirationUtc : null,
    isExpired: raw.isExpired === true ? true : raw.isExpired === false ? false : null,
    answerCode: typeof raw.answerCode === "string" ? raw.answerCode : null,
    answerText: typeof raw.answerText === "string" ? raw.answerText : null,
    reason: typeof raw.reason === "string" ? raw.reason : null,
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

  return mapSecureNowQuestionDisposition((raw ?? {}) as Record<string, unknown>);
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
