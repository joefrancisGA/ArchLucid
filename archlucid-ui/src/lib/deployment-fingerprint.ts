/** Build-time deployment fingerprint surfaced in the operator shell footer and System health page. */
export type ClientDeploymentFingerprint = {
  readonly frontendCommitSha: string;
  readonly buildTimestamp: string;
  /** CI/deploy stamp (`GITHUB_RUN_ID`-attempt) when CD bakes `NEXT_PUBLIC_DEPLOY_STAMP`. */
  readonly deployStamp: string;
  /** Sequential GitHub Actions `run_number` when CD bakes `NEXT_PUBLIC_CI_BUILD_NUMBER`. */
  readonly ciBuildNumber: string;
  readonly environment: string;
  readonly apiUpstreamHost: string;
};

export type DeploymentBuildFingerprintStripVariant = "full" | "compact";

export function readClientDeploymentFingerprint(): ClientDeploymentFingerprint {
  return {
    frontendCommitSha: normalizeFingerprintValue(process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA),
    buildTimestamp: normalizeFingerprintValue(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP),
    deployStamp: normalizeFingerprintValue(process.env.NEXT_PUBLIC_DEPLOY_STAMP),
    ciBuildNumber: normalizeFingerprintValue(process.env.NEXT_PUBLIC_CI_BUILD_NUMBER),
    environment: normalizeFingerprintValue(
      process.env.NEXT_PUBLIC_DEPLOY_ENV?.trim()
        ? process.env.NEXT_PUBLIC_DEPLOY_ENV
        : process.env.NODE_ENV,
    ),
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

/** True when CD (or a test stub) supplied a real fingerprint field instead of the local-dev sentinel. */
export function isKnownFingerprintValue(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && trimmed !== "unknown";
}

/** Discrete footer label such as `Build 1842`, or null when the CI number was not baked in. */
export function formatCiBuildNumberLabel(ciBuildNumber: string): string | null {
  if (!isKnownFingerprintValue(ciBuildNumber)) {
    return null;
  }

  return `Build ${ciBuildNumber.trim()}`;
}

/** Full operator-footer line: CI number (when known), short SHA, timestamp, env, API host. */
export function formatDeploymentBuildFingerprintLine(fingerprint: ClientDeploymentFingerprint): string {
  const parts: string[] = [];
  const ciLabel = formatCiBuildNumberLabel(fingerprint.ciBuildNumber);

  if (ciLabel !== null) {
    parts.push(ciLabel);
  }

  parts.push(`UI build ${formatShortCommitSha(fingerprint.frontendCommitSha)}`);
  parts.push(fingerprint.buildTimestamp);
  parts.push(`env ${fingerprint.environment}`);
  parts.push(`API ${fingerprint.apiUpstreamHost}`);

  return parts.join(" · ");
}

function normalizeFingerprintValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return "unknown";
  }

  return trimmed;
}
