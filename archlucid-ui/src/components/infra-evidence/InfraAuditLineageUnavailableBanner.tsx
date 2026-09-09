import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraAuditLineageUnavailableBannerProps = {
  readonly degradedReason?: string | null;
  readonly testId?: string;
  readonly auditTabHref?: string | null;
  readonly clearAuditScopeHref?: string | null;
};

export function InfraAuditLineageUnavailableBanner(
  props: InfraAuditLineageUnavailableBannerProps,
): React.JSX.Element {
  const {
    degradedReason,
    testId = "infra-audit-lineage-unavailable-banner",
    auditTabHref = null,
    clearAuditScopeHref = null,
  } = props;

  return (
    <div
      className={cn("m-0 rounded border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={testId}
      role="status"
    >
      <p className="m-0">
        Audit lineage is unavailable for this resource
        {degradedReason != null && degradedReason.trim().length > 0
          ? `: ${degradedReason.trim()}`
          : "; hub and workbench links stay resource-scoped only."}
      </p>
      {(auditTabHref != null || clearAuditScopeHref != null) ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {auditTabHref != null ? (
            <Button asChild variant="outline" size="sm" data-testid={`${testId}-open-audit-tab`}>
              <Link href={auditTabHref}>Open audit tab</Link>
            </Button>
          ) : null}
          {clearAuditScopeHref != null ? (
            <Button asChild variant="outline" size="sm" data-testid={`${testId}-clear-stale-scope`}>
              <Link href={clearAuditScopeHref}>Clear stale audit scope</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
