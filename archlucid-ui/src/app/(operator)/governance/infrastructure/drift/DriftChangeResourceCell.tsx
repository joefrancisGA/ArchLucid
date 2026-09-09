import {
  EnterpriseTableCell,
} from "@/components/ui/enterprise-table";
import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DriftChangeResourceCells(props: {
  readonly azureResourceId: string | null;
}): React.JSX.Element {
  const display = formatAzureResourceDisplay(props.azureResourceId);

  return (
    <>
      <EnterpriseTableCell className="max-w-xs">
        <div className={cn(OPERATOR_TYPOGRAPHY.body, "font-medium")}>
          {display.name}
        </div>
      </EnterpriseTableCell>
      <EnterpriseTableCell>{display.resourceGroup ?? "—"}</EnterpriseTableCell>
      <EnterpriseTableCell>{display.resourceType ?? "—"}</EnterpriseTableCell>
    </>
  );
}
