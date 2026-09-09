import {
  EnterpriseTableCell,
} from "@/components/ui/enterprise-table";
import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DriftChangeResourceCell(props: {
  readonly azureResourceId: string | null;
}): React.JSX.Element {
  const display = formatAzureResourceDisplay(props.azureResourceId);

  return (
    <EnterpriseTableCell className="max-w-xs">
      <div className={cn(OPERATOR_TYPOGRAPHY.body, "font-medium")}>
        {display.primaryLabel}
      </div>
      {display.secondaryLabel != null ? (
        <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{display.secondaryLabel}</div>
      ) : null}
    </EnterpriseTableCell>
  );
}
