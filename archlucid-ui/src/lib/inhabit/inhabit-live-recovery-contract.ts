import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import type { EnterpriseCompactEmptyStateAction } from "@/components/EnterpriseCompactEmptyState";

export const INHABIT_FINDINGS_LIVE_RECOVERY_TITLE = "Findings load failed" as const;

export const INHABIT_FINDINGS_LIVE_RECOVERY_BODY =
  "Your architecture and prior dispositions are unchanged on the server. Retry the load, return to the architecture desk, or report a problem — live Working recovery does not offer sample packages or demo intake shortcuts." as const;

/** IH-071 — live Working nested findings recovery without demo/sample CTAs. */
export function resolveInhabitFindingsLiveRecoveryActions(
  architectureId: string | null | undefined,
): readonly EnterpriseCompactEmptyStateAction[] {
  const trimmedArchitectureId = architectureId?.trim() ?? "";

  if (trimmedArchitectureId.length === 0) {
    return [];
  }

  return [
    {
      label: "Open architecture desk",
      href: architectureIdentityPath(trimmedArchitectureId),
      variant: "primary",
    },
  ];
}
