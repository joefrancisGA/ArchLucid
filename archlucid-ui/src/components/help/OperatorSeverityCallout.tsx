import { AlertTriangle, Ban } from "lucide-react";
import type { ReactNode } from "react";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorSeverityCalloutKind = "warn" | "blocked";

export type OperatorSeverityCalloutProps = {
  readonly kind: OperatorSeverityCalloutKind;
  readonly children: ReactNode;
  readonly className?: string;
  readonly "data-testid"?: string;
  readonly heading?: string;
  readonly headingId?: string;
};

function SeverityIcon(props: { readonly kind: OperatorSeverityCalloutKind }): React.JSX.Element {
  const iconClass = DESIGN_TOKENS.calloutSeverity[props.kind].iconClass;

  if (props.kind === "blocked") {
    return <Ban className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />;
  }

  return <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />;
}

/** Caution or blocked callout with icon and severity label — survives grayscale review. */
export function OperatorSeverityCallout(props: OperatorSeverityCalloutProps): React.JSX.Element {
  const shellClass =
    props.kind === "blocked" ? DESIGN_TOKENS.callout.blockedShell : DESIGN_TOKENS.callout.warnShell;
  const label = DESIGN_TOKENS.calloutSeverity[props.kind].label;

  return (
    <aside
      className={cn(shellClass, props.className)}
      data-testid={props["data-testid"]}
      {...(props.headingId !== undefined ? { "aria-labelledby": props.headingId } : {})}
    >
      <SeverityIcon kind={props.kind} />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.micro, DESIGN_TOKENS.calloutSeverity[props.kind].labelClass)}>
            {label}
          </span>
          {props.heading !== undefined ? (
            <h2
              id={props.headingId}
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              {props.heading}
            </h2>
          ) : null}
        </div>
        <div className={OPERATOR_TYPOGRAPHY.body}>{props.children}</div>
      </div>
    </aside>
  );
}
