"use client";

import { useState } from "react";

import { EnterpriseTableCell } from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import { cn } from "@/lib/utils";

export function RemediationPriorityResourceCell(props: {
  readonly findingId: string;
  readonly cloudResourceId: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const resourceId = props.cloudResourceId?.trim() ?? "";

  if (resourceId.length === 0) {
    return <EnterpriseTableCell>{AZURE_RESOURCE_NAME_NOT_RECORDED_LABEL}</EnterpriseTableCell>;
  }

  const resourceName = formatCloudResourceDisplayName({ externalResourceId: resourceId });

  return (
    <EnterpriseTableCell>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{resourceName}</p>
      <button
        type="button"
        aria-expanded={open}
        className={cn("mt-1 border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`remediation-priority-resource-id-${props.findingId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide resource id" : "Show resource id"}
      </button>
      {open ? <p className={cn("m-0 mt-1 break-all font-mono", OPERATOR_TYPOGRAPHY.helper)}>{resourceId}</p> : null}
    </EnterpriseTableCell>
  );
}
