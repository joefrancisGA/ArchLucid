"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  FINISH_SETUP_SYSTEM_HEALTH_PATH,
  resolveFinishSetupWizardDeploymentOptions,
  type FinishSetupWizardContext,
} from "@/lib/finish-setup-wizard-steps";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL } from "@/lib/buyer/buyer-polish-copy";

type OptionalWorkspaceSetupRow = {
  readonly id: string;
  readonly title: string;
  readonly benefit: string;
  readonly statusLabel: string;
  readonly statusKind: "ready" | "neutral" | "draft";
  readonly href: string;
  readonly actionLabel: string;
};

function resolveOptionalWorkspaceSetupRows(context: FinishSetupWizardContext): OptionalWorkspaceSetupRow[] {
  const deployment = resolveFinishSetupWizardDeploymentOptions();
  const rows: OptionalWorkspaceSetupRow[] = [
    {
      id: "identity",
      title: "Identity and single sign-on",
      benefit: "Allow users to sign in with corporate credentials.",
      statusLabel: "Optional",
      statusKind: "neutral",
      href: "/administration/identity/sso-wizard",
      actionLabel: "Open SSO wizard",
    },
    {
      id: "admin-role",
      title: "Administrator access",
      benefit: "Confirm that at least one workspace administrator is assigned.",
      statusLabel: context.principalAdmin ? "Complete" : "Not configured",
      statusKind: context.principalAdmin ? "ready" : "draft",
      href: SETTINGS_USERS_PATH,
      actionLabel: "Manage roles",
    },
  ];

  if (deployment.selfHosted) {
    const healthReady = context.healthReady && !context.healthLoadFailed;

    rows.push({
      id: "platform-health",
      title: "Platform health",
      benefit: "Confirm that required services are available.",
      statusLabel: healthReady ? "Ready" : "Needs attention",
      statusKind: healthReady ? "ready" : "draft",
      href: FINISH_SETUP_SYSTEM_HEALTH_PATH,
      actionLabel: "Open system health",
    });
  }

  rows.push({
    id: "roi-baseline",
    title: "ROI baseline",
    benefit: "Add assumptions used in executive and portfolio value reporting.",
    statusLabel: "Optional",
    statusKind: "neutral",
    href: "/administration/baseline",
    actionLabel: "Configure ROI baseline",
  });

  return rows;
}

export function OptionalWorkspaceSetupList(): React.JSX.Element | null {
  const { phase, context } = useFinishSetupReadinessContext();

  if (phase === "loading" || context === null) {
    return null;
  }

  const rows = resolveOptionalWorkspaceSetupRows(context);

  return (
    <ul className="m-0 list-none space-y-3 p-0" data-testid="optional-workspace-setup-list">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-col gap-2 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between"
          data-testid={`optional-workspace-setup-row-${row.id}`}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                {row.title}
              </span>
              <StatusTag kind={row.statusKind} label={row.statusLabel} />
            </div>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{row.benefit}</p>
          </div>
          <Link href={row.href} className={cn(OPERATOR_LINK.inline, "shrink-0", OPERATOR_TYPOGRAPHY.body)}>
            {row.actionLabel}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OptionalWorkspaceSetupDismissButton({
  onDismiss,
}: {
  readonly onDismiss: () => void;
}): React.JSX.Element {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onDismiss} data-testid="optional-workspace-setup-dismiss">
      {ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL}
    </Button>
  );
}
