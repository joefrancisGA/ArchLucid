/** Build-time deployment fingerprint surfaced in the operator shell footer and /health page. */
export type ClientDeploymentFingerprint = {
  readonly frontendCommitSha: string;
  readonly buildTimestamp: string;
  readonly environment: string;
  readonly apiUpstreamHost: string;
};

export function readClientDeploymentFingerprint(): ClientDeploymentFingerprint {
  return {
    frontendCommitSha: normalizeFingerprintValue(process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA),
    buildTimestamp: normalizeFingerprintValue(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP),
    environment: normalizeFingerprintValue(process.env.NEXT_PUBLIC_DEPLOY_ENV ?? process.env.NODE_ENV),
    apiUpstreamHost: normalizeFingerprintValue(process.env.NEXT_PUBLIC_API_UPSTREAM_HOST),
  };
}

export function formatShortCommitSha(commitSha: string): string {
  const trimmed = commitSha.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return trimmed.slice(0, 12);
}

function normalizeFingerprintValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return "unknown";
  }

  return trimmed;
}
