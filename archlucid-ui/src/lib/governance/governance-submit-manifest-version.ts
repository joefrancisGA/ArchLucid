export const GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT = "1.0.0" as const;

/** Strict numeric semver: major.minor.patch with non-negative integer segments. */
const NUMERIC_SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export type GovernanceSubmitManifestVersionValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string };

export function isNumericSemverManifestVersion(version: string): boolean {
  return NUMERIC_SEMVER_PATTERN.test(version.trim());
}

export function parseNumericSemverManifestVersion(version: string): [number, number, number] | null {
  const trimmed = version.trim();

  if (!isNumericSemverManifestVersion(trimmed)) {
    return null;
  }

  const parts = trimmed.split(".").map((segment) => Number.parseInt(segment, 10));

  if (parts.length !== 3 || parts.some((segment) => Number.isNaN(segment))) {
    return null;
  }

  return [parts[0]!, parts[1]!, parts[2]!];
}

export function compareNumericSemverManifestVersions(left: string, right: string): number | null {
  const leftParts = parseNumericSemverManifestVersion(left);
  const rightParts = parseNumericSemverManifestVersion(right);

  if (leftParts === null || rightParts === null) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    const delta = leftParts[index]! - rightParts[index]!;

    if (delta !== 0) {
      return delta < 0 ? -1 : 1;
    }
  }

  return 0;
}

export function resolveDefaultGovernanceSubmitManifestVersion(
  maxPersistedManifestVersion: string | null | undefined,
): string {
  const maxTrimmed = maxPersistedManifestVersion?.trim() ?? "";

  if (maxTrimmed.length > 0 && isNumericSemverManifestVersion(maxTrimmed)) {
    return maxTrimmed;
  }

  return GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT;
}

export function validateGovernanceSubmitManifestVersion(
  version: string,
  maxPersistedManifestVersion: string | null | undefined,
): GovernanceSubmitManifestVersionValidation {
  const trimmed = version.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: "Review record version is required." };
  }

  if (!isNumericSemverManifestVersion(trimmed)) {
    return {
      valid: false,
      message: "Review record version must use numeric semver (for example 1.0.0).",
    };
  }

  const maxTrimmed = maxPersistedManifestVersion?.trim() ?? "";

  if (maxTrimmed.length > 0 && isNumericSemverManifestVersion(maxTrimmed)) {
    const comparison = compareNumericSemverManifestVersions(trimmed, maxTrimmed);

    if (comparison !== null && comparison < 0) {
      return {
        valid: false,
        message: `Review record version cannot be lower than ${maxTrimmed} for this review.`,
      };
    }
  }

  return { valid: true };
}
