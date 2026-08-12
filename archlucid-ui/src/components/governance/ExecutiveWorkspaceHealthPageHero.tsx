"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  executiveWorkspaceHealthPageLead,
  executiveWorkspaceHealthPageTitle,
  EXECUTIVE_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL,
} from "@/lib/executive-workspace-health-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ExecutiveWorkspaceHealthPageHeroProps = {
  readonly buyerPolishedShell: boolean;
};

/** Page hero for Executive Workspace Health — title, lead, contextual help, and workflow handoff. */
export function ExecutiveWorkspaceHealthPageHero({
  buyerPolishedShell,
}: ExecutiveWorkspaceHealthPageHeroProps): React.JSX.Element {
  return (
    <header
      className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800"
      data-testid="executive-workspace-health-page-hero"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className={cn("m-0 tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
            {executiveWorkspaceHealthPageTitle(buyerPolishedShell)}
          </h1>
          <p className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {executiveWorkspaceHealthPageLead(buyerPolishedShell)}
          </p>
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center gap-2"
          data-testid="executive-workspace-health-hero-actions"
        >
          <PageContextualHelpButton />
          <Link
            href="/governance/approval-queue"
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="executive-workspace-health-workflow-link"
          >
            {EXECUTIVE_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL}
          </Link>
        </div>
      </div>
    </header>
  );
}
