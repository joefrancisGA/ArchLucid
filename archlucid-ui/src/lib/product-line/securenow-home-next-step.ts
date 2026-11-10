import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export const SECURENOW_HOME_FIRST_HOUR_STOP_HREF = "/administration/securenow-first-hour#stop" as const;

export const SECURENOW_DRIFT_POST_CAPTURE_NEXT_SUMMARY =
  "After this capture, open one ranked path. A blank ranking is not a clean result." as const;

export type SecureNowHomeEnvironmentNextStepInput = {
  readonly needsCollection: boolean;
  readonly selectedPathId: string;
  readonly firstRankedPathId: string;
};

export function resolveSecureNowHomeEnvironmentNextStep(
  input: SecureNowHomeEnvironmentNextStepInput,
): { readonly label: string; readonly href: string } {
  if (input.needsCollection) {
    return { label: "Next: Scope and freshness", href: CLOUD_CONNECTIONS_PATH };
  }

  const selectedPathId = input.selectedPathId.trim();

  if (selectedPathId.length > 0) {
    return { label: "Next: Stop", href: SECURENOW_HOME_FIRST_HOUR_STOP_HREF };
  }

  const firstRankedPathId = input.firstRankedPathId.trim();

  if (firstRankedPathId.length > 0) {
    return {
      label: "Next: One ranked path",
      href: `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${encodeURIComponent(firstRankedPathId)}`,
    };
  }

  return { label: "Next: One ranked path", href: SECURENOW_REMEDIATION_FACTORY_PATH };
}

export function resolveSecureNowPostDriftNextHref(firstRankedPathId: string | null): string {
  const trimmed = firstRankedPathId?.trim() ?? "";

  if (trimmed.length > 0) {
    return `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${encodeURIComponent(trimmed)}`;
  }

  return SECURENOW_REMEDIATION_FACTORY_PATH;
}

export function resolveSecureNowPostDriftNextLinkLabel(firstRankedPathId: string | null): string {
  const trimmed = firstRankedPathId?.trim() ?? "";

  if (trimmed.length > 0) {
    return "Open Path inspect for the top ranked path";
  }

  return "Open Path inspect";
}

export function resolveSecureNowHomePrimaryReturnHref(input: {
  readonly collectionComplete: boolean;
  readonly selectedPathId: string;
  readonly firstRankedPathId: string;
}): string {
  if (!input.collectionComplete) {
    return CLOUD_CONNECTIONS_PATH;
  }

  return resolveSecureNowHomeEnvironmentNextStep({
    needsCollection: false,
    selectedPathId: input.selectedPathId,
    firstRankedPathId: input.firstRankedPathId,
  }).href;
}
