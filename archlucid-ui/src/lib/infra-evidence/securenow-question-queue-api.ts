import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";

export type SecureNowQuestion = {
  readonly dispositionId: string | null;
  readonly snapshotId: string;
  readonly subscriptionId: string;
  readonly resourceId: string;
  readonly questionKey: string;
  readonly source: string;
  readonly scopeKind: string;
  readonly status: string;
  readonly questionText: string;
  readonly sourceLine: string;
  readonly answerCodes: readonly string[];
  readonly evidenceFingerprint: string;
  readonly expirationUtc: string | null;
  readonly isExpired: boolean;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string | null;
};

export type SecureNowQuestionWrite = {
  readonly subscriptionId: string;
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
  readonly subscriptionId: string;
  readonly resourceId: string;
  readonly questionKey: string;
  readonly reason: string;
};

function stringOrDefault(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapQuestion(raw: Record<string, unknown>): SecureNowQuestion {
  return {
    dispositionId: typeof raw.dispositionId === "string" ? raw.dispositionId : null,
    snapshotId: stringOrDefault(raw.snapshotId),
    subscriptionId: stringOrDefault(raw.subscriptionId),
    resourceId: stringOrDefault(raw.resourceId),
    questionKey: stringOrDefault(raw.questionKey),
    source: stringOrDefault(raw.source),
    scopeKind: stringOrDefault(raw.scopeKind),
    status: stringOrDefault(raw.status, "Open"),
    questionText: stringOrDefault(raw.questionText),
    sourceLine: stringOrDefault(raw.sourceLine),
    answerCodes: Array.isArray(raw.answerCodes)
      ? raw.answerCodes.filter((value): value is string => typeof value === "string")
      : [],
    evidenceFingerprint: stringOrDefault(raw.evidenceFingerprint),
    expirationUtc: typeof raw.expirationUtc === "string" ? raw.expirationUtc : null,
    isExpired: raw.isExpired === true,
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
