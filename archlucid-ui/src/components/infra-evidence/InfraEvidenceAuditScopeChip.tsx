import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraEvidenceAuditScopeChipProps = {
  readonly controlLabel?: string | null;
  readonly testId?: string;
};

export function InfraEvidenceAuditScopeChip(
  props: InfraEvidenceAuditScopeChipProps,
): React.JSX.Element {
  const { controlLabel, testId = "infra-evidence-audit-scope-chip" } = props;
  const trimmedLabel = controlLabel?.trim() ?? "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid={testId}
    >
      Audit scoped{trimmedLabel.length > 0 ? `: ${trimmedLabel}` : ""}
    </span>
  );
}
