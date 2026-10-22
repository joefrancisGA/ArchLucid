import { readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { readSignedInUserSubject } from "@/lib/oidc/session";
import { getOperatorScopeQueryKeySnapshot } from "@/lib/operator/operator-scope-query-key";

export const OPERATOR_QUERY_PERSIST_STORAGE_PREFIX = "archlucid:operator-query-cache:v1";

/** Matches operator query gcTime — stale persisted payloads are not rehydrated. */
export const OPERATOR_QUERY_PERSIST_MAX_AGE_MS = 5 * 60_000;

export function readOperatorQueryPersistUserSubject(): string {
  const subject = readSignedInUserSubject();

  if (subject !== null && subject.trim().length > 0) {
    return subject.trim();
  }

  return "anonymous";
}

export function buildOperatorQueryPersistBuster(): string {
  const fingerprint = readClientDeploymentFingerprint();

  return fingerprint.frontendCommitSha;
}

export function buildOperatorQueryPersistStorageKey(
  scopeSnapshot: string = getOperatorScopeQueryKeySnapshot(),
  userSubject: string = readOperatorQueryPersistUserSubject(),
  buildBuster: string = buildOperatorQueryPersistBuster(),
): string {
  return `${OPERATOR_QUERY_PERSIST_STORAGE_PREFIX}:${buildBuster}:${userSubject}:${scopeSnapshot}`;
}
