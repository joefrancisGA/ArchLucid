import type { ReactNode } from "react";

import {
  resolveCaiqSigEvidenceAffordance,
  type CaiqSigEvidenceAffordanceKind,
} from "@/lib/caiq-sig-response-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CaiqSigResponseHelpEvidenceCellProps = {
  readonly evidenceMarkdown: string;
  readonly statusLabel?: string;
  readonly renderInline: (text: string, keyPrefix: string) => ReactNode[];
};

function evidenceKindClass(kind: CaiqSigEvidenceAffordanceKind): string {
  switch (kind) {
    case "linked-artifact":
      return "text-al-text-secondary";
    case "inherited-provider":
      return "text-al-text-secondary italic";
    case "nda-on-request":
      return "text-al-text-secondary";
    case "prose-only":
      return "text-al-text-secondary italic";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function CaiqSigResponseHelpEvidenceCell(props: CaiqSigResponseHelpEvidenceCellProps): React.JSX.Element {
  const affordance = resolveCaiqSigEvidenceAffordance(props.evidenceMarkdown, props.statusLabel);
  const body = props.evidenceMarkdown.trim();

  return (
    <div className="space-y-1">
      {body.length > 0 ? (
        <div>{props.renderInline(body, "caiq-sig-evidence-body")}</div>
      ) : null}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.micro, evidenceKindClass(affordance.kind))}>
        {affordance.qualifier}
      </p>
    </div>
  );
}
