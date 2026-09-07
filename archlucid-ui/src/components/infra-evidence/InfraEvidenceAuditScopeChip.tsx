import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraEvidenceAuditScopeChipProps = {
  readonly controlLabel?: string | null;
  readonly href?: string | null;
  readonly testId?: string;
};

export function InfraEvidenceAuditScopeChip(
  props: InfraEvidenceAuditScopeChipProps,
): React.JSX.Element {
  const { controlLabel, href, testId = "infra-evidence-audit-scope-chip" } = props;
  const trimmedLabel = controlLabel?.trim() ?? "";
  const trimmedHref = href?.trim() ?? "";
  const chipLabel = `Audit scoped${trimmedLabel.length > 0 ? `: ${trimmedLabel}` : ""}`;
  const chipClassName = cn(
    "inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground",
    trimmedHref.length > 0 ? "text-al-link hover:bg-muted/50 hover:underline" : undefined,
    OPERATOR_TYPOGRAPHY.helper,
  );

  if (trimmedHref.length > 0) {
    return (
      <Link
        className={chipClassName}
        href={trimmedHref}
        data-testid={testId}
        aria-label={`${chipLabel}. Open audit lineage tab.`}
      >
        {chipLabel}
      </Link>
    );
  }

  return (
    <span
      className={chipClassName}
      data-testid={testId}
    >
      {chipLabel}
    </span>
  );
}
