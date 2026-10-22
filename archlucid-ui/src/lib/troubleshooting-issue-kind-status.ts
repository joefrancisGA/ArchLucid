import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { TroubleshootingIssueKind } from "@/lib/troubleshooting-help-guide-content";
import { TROUBLESHOOTING_ISSUE_KIND_LABELS } from "@/lib/troubleshooting-help-guide-content";

export type TroubleshootingIssueKindStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Maps issue owner kind to StatusTag tokens (custom labels, canonical shells). */
export function resolveTroubleshootingIssueKindStatus(
  issueKind: TroubleshootingIssueKind,
): TroubleshootingIssueKindStatus {
  switch (issueKind) {
    case "user-fixable":
      return { kind: "neutral", label: TROUBLESHOOTING_ISSUE_KIND_LABELS[issueKind] };

    case "workspace-admin":
      return { kind: "needs-attention", label: TROUBLESHOOTING_ISSUE_KIND_LABELS[issueKind] };

    case "archlucid-support":
      return { kind: "in-progress", label: TROUBLESHOOTING_ISSUE_KIND_LABELS[issueKind] };

    case "internal-operator":
      return { kind: "draft", label: TROUBLESHOOTING_ISSUE_KIND_LABELS[issueKind] };

    default: {
      const exhaustive: never = issueKind;

      return exhaustive;
    }
  }
}
