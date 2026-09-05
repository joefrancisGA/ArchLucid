"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION } from "@/lib/admin-diagnostics-help-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAdminDiagnosticsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Primary live-surface CTA plus print actions for admin diagnostics help (HAE). */
export function HelpAdminDiagnosticsHeaderActions(
  props: HelpAdminDiagnosticsHeaderActionsProps,
): React.ReactElement | null {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-admin-diagnostics-header-actions">
      <Button asChild size="sm" data-testid={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.testId}>
        <Link href={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href}>{ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.adminOnly === true ? (
        <StatusTag kind="neutral" label="Admin" data-testid="help-admin-diagnostics-primary-admin-tag" />
      ) : null}
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
