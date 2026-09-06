import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraAuditLineageUnavailableBannerProps = {
  readonly degradedReason?: string | null;
  readonly testId?: string;
};

export function InfraAuditLineageUnavailableBanner(
  props: InfraAuditLineageUnavailableBannerProps,
): React.JSX.Element {
  const { degradedReason, testId = "infra-audit-lineage-unavailable-banner" } = props;

  return (
    <p
      className={cn("m-0 rounded border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={testId}
      role="status"
    >
      Audit lineage is unavailable for this resource
      {degradedReason != null && degradedReason.trim().length > 0
        ? `: ${degradedReason.trim()}`
        : "; hub and workbench links stay resource-scoped only."}
    </p>
  );
}
