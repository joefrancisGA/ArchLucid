"use client";

import { EnterpriseTableCell } from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import { cn } from "@/lib/utils";

export function RemediationPriorityResourceCell(props: {
  readonly cloudResourceId: string | null | undefined;
}) {
  const resourceId = props.cloudResourceId?.trim() ?? "";

  if (resourceId.length === 0) {
    return <EnterpriseTableCell>{AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL}</EnterpriseTableCell>;
  }

  const resourceName = formatCloudResourceDisplayName({ externalResourceId: resourceId });

  return (
    <EnterpriseTableCell>
      <p className={cn("m-0 break-all", OPERATOR_TYPOGRAPHY.body)}>{resourceName}</p>
    </EnterpriseTableCell>
  );
}
