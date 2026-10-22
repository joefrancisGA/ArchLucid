import type { ReactNode } from "react";

import { StatusTag } from "@/components/StatusTag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  mapSecurityTrustPostureStatusToTagKind,
  resolveSecurityTrustPostureStatusQualifier,
  resolveSecurityTrustPostureStatusTagLabel,
} from "@/lib/security-trust-help-presentation";
import { cn } from "@/lib/utils";

type SecurityTrustHelpStatusCellProps = {
  readonly statusLabel: string;
  readonly renderInline?: (text: string, keyPrefix: string) => ReactNode[];
};

export function SecurityTrustHelpStatusCell(props: SecurityTrustHelpStatusCellProps): React.JSX.Element {
  const label = resolveSecurityTrustPostureStatusTagLabel(props.statusLabel);
  const kind = mapSecurityTrustPostureStatusToTagKind(props.statusLabel);
  const qualifier = resolveSecurityTrustPostureStatusQualifier(props.statusLabel);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusTag kind={kind} label={label} />
        {qualifier !== null ? (
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{qualifier}</span>
        ) : null}
      </div>
    </div>
  );
}
