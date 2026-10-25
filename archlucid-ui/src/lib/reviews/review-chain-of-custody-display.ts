export const POLICY_PACK_WAS_NOT_STORED = "Policy pack was not stored.";
export const POLICY_PACK_VERSION_WAS_NOT_STORED = "Policy pack version was not stored.";
export const TRIGGER_SOURCE_WAS_NOT_STORED = "Trigger source was not stored.";
export const PACKAGE_NOT_YET_SEALED = "Not yet sealed";
export const SEALED_TIME_WAS_NOT_STORED = "Sealed time was not stored.";

export function reviewChainOfCustodyPolicyPackAppliedLabel(
  ruleSetId: string | null | undefined,
): string {
  const id = ruleSetId?.trim() ?? "";

  if (id.length === 0) {
    return POLICY_PACK_WAS_NOT_STORED;
  }

  return id;
}

export function reviewChainOfCustodyPolicyPackVersionLabel(
  ruleSetId: string | null | undefined,
  ruleSetVersion: string | null | undefined,
): string | null {
  const id = ruleSetId?.trim() ?? "";

  if (id.length === 0) {
    return null;
  }

  const version = ruleSetVersion?.trim() ?? "";

  if (version.length === 0) {
    return POLICY_PACK_VERSION_WAS_NOT_STORED;
  }

  return `v${version}`;
}

export function reviewChainOfCustodyTriggerSourceLabel(
  source: "ui" | "api" | "ci" | null | undefined,
): string {
  if (source === "api") {
    return "API";
  }

  if (source === "ci") {
    return "CI pipeline";
  }

  if (source === "ui") {
    return "Web UI";
  }

  return TRIGGER_SOURCE_WAS_NOT_STORED;
}

export function reviewChainOfCustodyPackageSealedLabel(
  manifestId: string | null,
  completedLabel: string | null,
): string {
  if (manifestId === null) {
    return PACKAGE_NOT_YET_SEALED;
  }

  if (completedLabel !== null && completedLabel.trim().length > 0) {
    return completedLabel;
  }

  return SEALED_TIME_WAS_NOT_STORED;
}
