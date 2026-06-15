"use client";

import Link from "next/link";

import type { SetupHealthPresentation } from "@/lib/setup-health-present";
import { OPERATOR_CALLOUT_WARN_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
      <p className="m-0 mt-1 text-sm leading-snug">
        Resolve readiness checks before starting reviews.{" "}
        <Link
          href="/help/troubleshooting"
          className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
        >
          Troubleshooting guide
        </Link>
      </p>
    </section>
  );
}
