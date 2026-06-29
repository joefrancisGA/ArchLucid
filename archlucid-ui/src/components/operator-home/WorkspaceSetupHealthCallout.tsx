"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import type { SetupHealthPresentation } from "@/lib/setup-health-present";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type WorkspaceSetupHealthCalloutProps = {
  readonly presentation: SetupHealthPresentation;
  readonly className?: string;
};

/** Workspace status disclosure body — surfaces unhealthy setup with remediation links. */
export function WorkspaceSetupHealthCallout(props: WorkspaceSetupHealthCalloutProps): React.JSX.Element {
  return (
    <section
      aria-label="Workspace setup health"
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, props.className)}
      data-testid="workspace-setup-health-callout"
    >
      <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{props.presentation.label}</p>
      <p className={cn("m-0 mt-1 leading-snug", OPERATOR_TYPOGRAPHY.body)}>
        {props.presentation.tone === "unknown"
          ? "Some workspace services are unavailable."
          : "Resolve readiness checks before starting reviews."}{" "}
        <Link
          href="/help/troubleshooting"
          className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
        >
          Open troubleshooting
        </Link>
        {props.presentation.tone === "unknown" ? (
          <>
            {" "}
            or review{" "}
            <Link href="/health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
              system health
            </Link>
          </>
        ) : null}
        .
      </p>
    </section>
  );
}
