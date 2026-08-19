import type { ReactNode } from "react";

import { StatusTag } from "@/components/StatusTag";
import {
  mapCaiqSigStatusLabelToTagKind,
  resolveCaiqSigStatusNarrative,
  resolveCaiqSigStatusQualifier,
  resolveCaiqSigStatusTagLabel,
} from "@/lib/caiq-sig-response-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CaiqSigResponseHelpStatusCellProps = {
  readonly statusLabel: string;
  readonly renderInline?: (text: string, keyPrefix: string) => ReactNode[];
};

export function CaiqSigResponseHelpStatusCell(props: CaiqSigResponseHelpStatusCellProps): React.JSX.Element {
  const label = resolveCaiqSigStatusTagLabel(props.statusLabel);
  const kind = mapCaiqSigStatusLabelToTagKind(props.statusLabel);
  const qualifier = resolveCaiqSigStatusQualifier(props.statusLabel);
  const narrative = resolveCaiqSigStatusNarrative(props.statusLabel);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusTag kind={kind} label={label} />
        {qualifier !== null ? (
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{qualifier}</span>
        ) : null}
      </div>
      {narrative !== null ? (
        <div className={OPERATOR_TYPOGRAPHY.body}>
          {props.renderInline !== undefined
            ? props.renderInline(narrative, "caiq-sig-status-narrative")
            : narrative}
        </div>
      ) : null}
    </div>
  );
}
