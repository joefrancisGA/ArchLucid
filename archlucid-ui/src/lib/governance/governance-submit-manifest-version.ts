export const GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT = "1.0.0" as const;

/** Strict numeric semver: major.minor.patch with non-negative integer segments. */
const NUMERIC_SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export type GovernanceSubmitManifestVersionValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string };

export function isNumericSemverManifestVersion(version: string): boolean {
  return NUMERIC_SEMVER_PATTERN.test(version.trim());
}

function parseNumericSemverManifestVersion(version: string): string[] | null {
  const trimmed = version.trim();

  return isNumericSemverManifestVersion(trimmed)
    ? trimmed.split(".").map((segment) => segment.replace(/^0+(?=\d)/, ""))
    : null;
}

export function compareNumericSemverManifestVersions(left: string, right: string): number | null {
  const leftParts = parseNumericSemverManifestVersion(left);
  const rightParts = parseNumericSemverManifestVersion(right);

  if (leftParts === null || rightParts === null) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    const leftPart = leftParts[index]!;
    const rightPart = rightParts[index]!;

    if (leftPart.length !== rightPart.length) {
      return leftPart.length < rightPart.length ? -1 : 1;
    }

    if (leftPart !== rightPart) {
      return leftPart < rightPart ? -1 : 1;
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
