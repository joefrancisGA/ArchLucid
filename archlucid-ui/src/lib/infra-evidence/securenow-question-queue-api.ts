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
  readonly questionText: string | null;
  readonly resourceType: string;
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

function stringOrDefault(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalStringField(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? value : null;
}

function mapQuestion(raw: Record<string, unknown>): SecureNowQuestion {
  const questionText = optionalStringField(raw.questionText);

  return {
    dispositionId: typeof raw.dispositionId === "string" ? raw.dispositionId : null,
    snapshotId: stringOrDefault(raw.snapshotId),
    subscriptionId: typeof raw.subscriptionId === "string"
      ? raw.subscriptionId
      : raw.subscriptionId === null || raw.subscriptionId === undefined
        ? null
        : "",
    resourceId: raw.resourceId === null || raw.resourceId === undefined ? null : stringOrDefault(raw.resourceId),
    questionKey: stringOrDefault(raw.questionKey),
    source: typeof raw.source === "string" ? raw.source : null,
    scopeKind: typeof raw.scopeKind === "string" ? raw.scopeKind : null,
    status: typeof raw.status === "string" ? raw.status : null,
    questionText,
    resourceType: stringOrDefault(raw.resourceType),
    resourceName: optionalStringField(raw.resourceName),
    reasonText: stringOrDefault(raw.reasonText),
    sourceLine: stringOrDefault(raw.sourceLine),
    answerCodes: Array.isArray(raw.answerCodes)
      ? raw.answerCodes.filter((value): value is string => typeof value === "string")
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

export function answerSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
): Promise<SecureNowQuestion | undefined> {
  return proxyJsonPost<SecureNowQuestion | undefined>(`${questionPath(snapshotId)}/answer`, request);
}

export function ignoreSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
): Promise<SecureNowQuestion | undefined> {
  return proxyJsonPost<SecureNowQuestion | undefined>(`${questionPath(snapshotId)}/ignore`, request);
}

export function reopenSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionReopen,
): Promise<SecureNowQuestion | undefined> {
  return proxyJsonPost<SecureNowQuestion | undefined>(`${questionPath(snapshotId)}/reopen`, request);
}
