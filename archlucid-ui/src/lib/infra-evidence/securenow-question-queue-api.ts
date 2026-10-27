import {
  secureNowQuestionCountsAsReviewableQueueRow,
  secureNowQuestionDispositionIsAnswered,
  secureNowQuestionDispositionIsDismissed,
  secureNowQuestionDispositionIsOpen,
} from "@/lib/infra-evidence/securenow-question-disposition-status";
import {
  secureNowQuestionDispositionPostExpirationFailsClosedStatusGate,
  secureNowQuestionDispositionPostExpirationTimestampUnparsable,
} from "@/lib/infra-evidence/securenow-question-expiration";
import {
  secureNowQuestionDispositionMutationEvidenceFingerprint,
  secureNowQuestionDispositionMutationQuestionKey,
  secureNowQuestionDispositionMutationResourceId,
  secureNowQuestionDispositionMutationScopeKind,
  secureNowQuestionDispositionMutationSource,
  secureNowQuestionDispositionMutationSubscriptionId,
  secureNowQuestionDispositionQuestionKeyImpliesInferredConnection,
} from "@/lib/infra-evidence/securenow-question-mutation-resource-id";
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
  readonly questionText: string | null;
  readonly resourceType: string | null;
  readonly resourceName: string | null;
  readonly reasonText: string | null;
  readonly sourceLine: string | null;
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

export type SecureNowQuestionDispositionPostOptions = {
  readonly expectedListedDispositionId?: string | null;
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

function mapListedOptionalStringPreservingEmpty(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value.length === 0) {
    return "";
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function mapListedOptionalStringCollapsingWhitespace(value: unknown): string | null {
  const trimmed = mapListedOptionalStringPreservingEmpty(value);

  if (trimmed === null) {
    return null;
  }

  return trimmed.length > 0 ? trimmed : null;
}

function mapListedOptionalString(value: unknown): string | null {
  return mapListedOptionalStringCollapsingWhitespace(value);
}

function mapListedOptionalExpirationUtc(value: unknown): string | null {
  const mapped = mapListedOptionalString(value);
  if (mapped === null) {
    return null;
  }

  return secureNowQuestionDispositionPostExpirationTimestampUnparsable(mapped) ? null : mapped;
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

/**
 * When the listed row already has a stored disposition id, the POST response must match after trim.
 * Open rows with no listed id skip this check.
 */
export function secureNowQuestionDispositionResponseListedDispositionIdMatches(
  responseDispositionId: string,
  listedDispositionId: string | null | undefined,
): boolean {
  const listed = listedDispositionId?.trim() ?? "";
  if (listed.length === 0) {
    return true;
  }

  return responseDispositionId.trim() === listed;
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

/** Whether a POST disposition's question key matches the submitted mutation request after trim. */
export function secureNowQuestionDispositionResponseQuestionKeyMatchesRequest(
  dispositionQuestionKey: string,
  requestQuestionKey: string,
): boolean {
  const responseKey = secureNowQuestionDispositionMutationQuestionKey(dispositionQuestionKey);
  const requestKey = secureNowQuestionDispositionMutationQuestionKey(requestQuestionKey);

  if (responseKey === null || requestKey === null) {
    return false;
  }

  return responseKey === requestKey;
}

/** Whether a POST disposition's evidence fingerprint matches the submitted write request after trim. */
export function secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest(
  dispositionEvidenceFingerprint: string,
  requestEvidenceFingerprint: string,
): boolean {
  const responseFingerprint = secureNowQuestionDispositionMutationEvidenceFingerprint(
    dispositionEvidenceFingerprint,
  );
  const requestFingerprint = secureNowQuestionDispositionMutationEvidenceFingerprint(
    requestEvidenceFingerprint,
  );

  if (responseFingerprint === null || requestFingerprint === null) {
    return false;
  }

  return responseFingerprint === requestFingerprint;
}

/** Whether a POST disposition's subscription id matches the submitted mutation request after trim. */
export function secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest(
  dispositionSubscriptionId: string,
  requestSubscriptionId: string | null,
): boolean {
  const responseId = secureNowQuestionDispositionMutationSubscriptionId(dispositionSubscriptionId);
  const requestId = secureNowQuestionDispositionMutationSubscriptionId(requestSubscriptionId);

  if (responseId === null || requestId === null) {
    return false;
  }

  return responseId === requestId;
}

/** Whether a POST disposition's resource id matches the submitted mutation request after trim. */
export function secureNowQuestionDispositionResponseResourceIdMatchesRequest(
  dispositionResourceId: string,
  requestResourceId: string,
): boolean {
  return dispositionResourceId.trim() === requestResourceId.trim();
}

function secureNowQuestionDispositionResponseTrimmedStringMatchesRequest(
  dispositionValue: string,
  requestValue: string,
): boolean {
  return dispositionValue.trim() === requestValue.trim();
}

/** Whether a POST disposition's source matches the submitted answer/ignore write after trim. */
export function secureNowQuestionDispositionResponseSourceMatchesRequest(
  dispositionSource: string,
  requestSource: string,
): boolean {
  return secureNowQuestionDispositionResponseTrimmedStringMatchesRequest(
    dispositionSource,
    requestSource,
  );
}

/** Whether a POST disposition's scope kind matches the submitted answer/ignore write after trim. */
export function secureNowQuestionDispositionResponseScopeKindMatchesRequest(
  dispositionScopeKind: string,
  requestScopeKind: string,
): boolean {
  return secureNowQuestionDispositionResponseTrimmedStringMatchesRequest(
    dispositionScopeKind,
    requestScopeKind,
  );
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

export const secureNowQuestionDispositionResponseRequiredOperatorMetadataFields = [
  "actorKey",
  "updatedUtc",
] as const satisfies readonly (keyof SecureNowQuestionDisposition)[];

export function secureNowQuestionDispositionScopeRequiresResourceId(
  scopeKind: string,
): boolean {
  return scopeKind.trim().toLowerCase() === "resource";
}

function secureNowQuestionDispositionAnswerMetadataPresent(
  disposition: SecureNowQuestionDisposition,
): boolean {
  const answerCode = disposition.answerCode?.trim() ?? "";
  const answerText = disposition.answerText?.trim() ?? "";
  return answerCode.length > 0 || answerText.length > 0;
}

const secureNowQuestionDispositionAuditEntryRequiredStringFields = [
  "action",
  "actorKey",
  "occurredUtc",
] as const satisfies readonly (keyof SecureNowQuestionDispositionAudit)[];

function secureNowQuestionDispositionParsableUtcTimestamp(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return !secureNowQuestionDispositionPostExpirationTimestampUnparsable(trimmed);
}

function secureNowQuestionDispositionAuditEntriesAreUsable(
  auditEntries: readonly SecureNowQuestionDispositionAudit[],
): boolean {
  return auditEntries.every((entry) =>
    secureNowQuestionDispositionAuditEntryRequiredStringFields.every(
      (field) => entry[field].trim().length > 0,
    ) && secureNowQuestionDispositionParsableUtcTimestamp(entry.occurredUtc),
  );
}

export function secureNowQuestionDispositionResponseIsUsable(
  disposition: SecureNowQuestionDisposition,
): boolean {
  if (!secureNowQuestionDispositionResponseRequiredStringFields.every(
    (field) => disposition[field].length > 0,
  )) {
    return false;
  }

  if (
    secureNowQuestionDispositionScopeRequiresResourceId(disposition.scopeKind)
    && disposition.resourceId.length === 0
  ) {
    return false;
  }

  if (
    secureNowQuestionDispositionIsAnswered(disposition.status)
    && !secureNowQuestionDispositionAnswerMetadataPresent(disposition)
  ) {
    return false;
  }

  if (
    secureNowQuestionDispositionIsDismissed(disposition.status)
    && disposition.reason.trim().length === 0
  ) {
    return false;
  }

  if (
    secureNowQuestionDispositionIsDismissed(disposition.status)
    && secureNowQuestionDispositionAnswerMetadataPresent(disposition)
  ) {
    return false;
  }

  if (
    secureNowQuestionDispositionIsOpen(disposition.status)
    && secureNowQuestionDispositionAnswerMetadataPresent(disposition)
  ) {
    return false;
  }

  if (
    !secureNowQuestionDispositionIsAnswered(disposition.status)
    && !secureNowQuestionDispositionIsDismissed(disposition.status)
    && !secureNowQuestionDispositionIsOpen(disposition.status)
  ) {
    return false;
  }

  if (!secureNowQuestionDispositionAuditEntriesAreUsable(disposition.auditEntries)) {
    return false;
  }

  if (
    !secureNowQuestionDispositionResponseRequiredOperatorMetadataFields.every(
      (field) => disposition[field].trim().length > 0,
    )
  ) {
    return false;
  }

  if (!secureNowQuestionDispositionParsableUtcTimestamp(disposition.updatedUtc)) {
    return false;
  }

  if (
    (secureNowQuestionDispositionIsAnswered(disposition.status)
      || secureNowQuestionDispositionIsDismissed(disposition.status))
    && secureNowQuestionDispositionPostExpirationFailsClosedStatusGate(
      disposition.expirationUtc,
      disposition.isExpired,
    )
  ) {
    return false;
  }

  return true;
}

function secureNowQuestionDispositionPostAuditEntryShapeIsUsable(entry: unknown): boolean {
  return entry !== null && typeof entry === "object" && !Array.isArray(entry);
}

/** POST JSON must omit auditEntries or send an array of audit objects; other shapes are not usable. */
export function secureNowQuestionDispositionResponseAuditEntriesShapeIsUsable(
  raw: Record<string, unknown>,
): boolean {
  if (!("auditEntries" in raw)) {
    return true;
  }

  const auditEntries = raw.auditEntries;
  if (auditEntries === null || auditEntries === undefined) {
    return false;
  }

  if (!Array.isArray(auditEntries)) {
    return false;
  }

  return auditEntries.every(secureNowQuestionDispositionPostAuditEntryShapeIsUsable);
}

/** Mutation POST responses must be a JSON object, not an array or primitive. */
export function secureNowQuestionDispositionPostResponseBodyIsUsable(raw: unknown): boolean {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
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

/** List GET rows must be JSON objects; primitives and arrays are not question records. */
export function secureNowListedQuestionRowShapeIsUsable(raw: unknown): boolean {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw);
}

/** Listed rows need a stored question key or disposition id; fingerprint alone is not enough to mutate. */
export function secureNowListedQuestionRowHasStoredIdentity(
  question: Pick<SecureNowQuestion, "questionKey" | "dispositionId">,
): boolean {
  if (secureNowQuestionDispositionMutationQuestionKey(question.questionKey) !== null) {
    return true;
  }

  const dispositionId = question.dispositionId?.trim() ?? "";
  return dispositionId.length > 0;
}

/**
 * Rows with a stored question key must also carry subscription and resource ids the mutation
 * helpers accept; disposition-only rows without a key may still render closed outcomes.
 */
export function secureNowListedQuestionRowPassesOpenMutationPreflight(
  question: SecureNowQuestion,
): boolean {
  if (secureNowQuestionDispositionMutationQuestionKey(question.questionKey) === null) {
    if (secureNowQuestionDispositionIsOpen(question.status)) {
      return false;
    }

    return true;
  }

  if (secureNowQuestionDispositionMutationSubscriptionId(question.subscriptionId) === null) {
    return false;
  }

  if (secureNowQuestionDispositionMutationResourceId(question) === null) {
    return false;
  }

  if (!secureNowQuestionDispositionIsOpen(question.status)) {
    return true;
  }

  const mutationSource = secureNowQuestionDispositionMutationSource(question);
  const mutationScopeKind = secureNowQuestionDispositionMutationScopeKind(question);
  if (mutationSource === null || mutationScopeKind === null) {
    return false;
  }

  if (secureNowQuestionDispositionQuestionKeyImpliesInferredConnection(question.questionKey)) {
    return true;
  }

  return secureNowQuestionDispositionMutationEvidenceFingerprint(question.evidenceFingerprint) !== null;
}

/** Listed rows must appear in at least one review filter (Open/Answered/Dismissed/Status not stored). */
export function secureNowListedQuestionRowCountsAsReviewableQueueRow(
  question: SecureNowQuestion,
): boolean {
  return secureNowQuestionCountsAsReviewableQueueRow(question);
}

function mapListedQuestionText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function mapListedAnswerCodes(value: unknown): readonly string[] | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function mapQuestion(raw: Record<string, unknown>): SecureNowQuestion {
  return {
    dispositionId: mapListedOptionalString(raw.dispositionId),
    snapshotId: typeof raw.snapshotId === "string" ? raw.snapshotId.trim() : "",
    subscriptionId: mapListedOptionalStringPreservingEmpty(raw.subscriptionId),
    resourceId: mapListedOptionalString(raw.resourceId),
    questionKey: mapListedOptionalString(raw.questionKey),
    source: mapListedOptionalStringPreservingEmpty(raw.source),
    scopeKind: mapListedOptionalStringPreservingEmpty(raw.scopeKind),
    status: typeof raw.status === "string"
      ? (() => {
        const trimmed = raw.status.trim();
        return trimmed.length > 0 ? trimmed : null;
      })()
      : null,
    questionText: mapListedQuestionText(raw.questionText),
    resourceType: mapListedOptionalString(raw.resourceType),
    resourceName: mapListedOptionalString(raw.resourceName),
    reasonText: mapListedOptionalStringPreservingEmpty(raw.reasonText),
    sourceLine: mapListedOptionalStringPreservingEmpty(raw.sourceLine),
    answerCodes: mapListedAnswerCodes(raw.answerCodes),
    evidenceFingerprint: mapListedOptionalString(raw.evidenceFingerprint),
    expirationUtc: mapListedOptionalExpirationUtc(raw.expirationUtc),
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
  const contextSnapshotId = snapshotId.trim();
  return Array.isArray(raw)
    ? raw
      .filter(secureNowListedQuestionRowShapeIsUsable)
      .map((item) => mapQuestion(item as Record<string, unknown>))
      .filter((question) =>
        secureNowQuestionListedSnapshotMatchesContext(question.snapshotId, contextSnapshotId))
      .filter(secureNowListedQuestionRowHasStoredIdentity)
      .filter(secureNowListedQuestionRowPassesOpenMutationPreflight)
      .filter(secureNowListedQuestionRowCountsAsReviewableQueueRow)
    : [];
}

async function postSecureNowQuestionDisposition(
  path: string,
  contextSnapshotId: string,
  request: SecureNowQuestionWrite | SecureNowQuestionReopen,
  options?: SecureNowQuestionDispositionPostOptions,
): Promise<SecureNowQuestionDisposition | undefined> {
  const raw = await proxyJsonPost<unknown>(path, request);

  if (raw === null || raw === undefined) {
    return undefined;
  }

  if (!secureNowQuestionDispositionPostResponseBodyIsUsable(raw)) {
    return undefined;
  }

  const record = raw as Record<string, unknown>;
  if (!secureNowQuestionDispositionResponseAuditEntriesShapeIsUsable(record)) {
    return undefined;
  }

  const disposition = mapSecureNowQuestionDisposition(record);
  if (!secureNowQuestionListedSnapshotMatchesContext(disposition.snapshotId, contextSnapshotId)) {
    return undefined;
  }

  if (
    !secureNowQuestionDispositionResponseListedDispositionIdMatches(
      disposition.dispositionId,
      options?.expectedListedDispositionId,
    )
  ) {
    return undefined;
  }

  if (
    !secureNowQuestionDispositionResponseQuestionKeyMatchesRequest(
      disposition.questionKey,
      request.questionKey,
    )
  ) {
    return undefined;
  }

  if (
    !secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest(
      disposition.subscriptionId,
      request.subscriptionId,
    )
  ) {
    return undefined;
  }

  if (
    !secureNowQuestionDispositionResponseResourceIdMatchesRequest(
      disposition.resourceId,
      request.resourceId,
    )
  ) {
    return undefined;
  }

  if (
    "evidenceFingerprint" in request
    && !secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest(
      disposition.evidenceFingerprint,
      request.evidenceFingerprint,
    )
  ) {
    return undefined;
  }

  if ("source" in request) {
    if (
      !secureNowQuestionDispositionResponseSourceMatchesRequest(
        disposition.source,
        request.source,
      )
    ) {
      return undefined;
    }

    if (
      !secureNowQuestionDispositionResponseScopeKindMatchesRequest(
        disposition.scopeKind,
        request.scopeKind,
      )
    ) {
      return undefined;
    }
  }

  return secureNowQuestionDispositionResponseIsUsable(disposition) ? disposition : undefined;
}

export function answerSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
  options?: SecureNowQuestionDispositionPostOptions,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(
    `${questionPath(snapshotId)}/answer`,
    snapshotId,
    request,
    options,
  );
}

export function ignoreSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionWrite,
  options?: SecureNowQuestionDispositionPostOptions,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(
    `${questionPath(snapshotId)}/ignore`,
    snapshotId,
    request,
    options,
  );
}

export function reopenSecureNowQuestion(
  snapshotId: string,
  request: SecureNowQuestionReopen,
  options?: SecureNowQuestionDispositionPostOptions,
): Promise<SecureNowQuestionDisposition | undefined> {
  return postSecureNowQuestionDisposition(
    `${questionPath(snapshotId)}/reopen`,
    snapshotId,
    request,
    options,
  );
}
