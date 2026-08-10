"use client";

import Link from "next/link";

import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION } from "@/lib/admin-diagnostics-help-evidence-copy";
import { printHelpTopicPage } from "@/lib/help-topic-print";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAdminDiagnosticsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Primary live-surface CTA plus PDF / print actions for admin diagnostics help (HAE). */
export function HelpAdminDiagnosticsHeaderActions(
  props: HelpAdminDiagnosticsHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-admin-diagnostics-header-actions">
      <Button asChild size="sm" data-testid="help-admin-diagnostics-primary-action">
        <Link href={ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href}>{ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.adminOnly === true ? (
        <StatusTag kind="neutral" label="Admin" data-testid="help-admin-diagnostics-primary-admin-tag" />
      ) : null}
      {entry.pdfStatus === null ? null : (
        <>
          <HelpTopicPdfDownloadButton entry={entry} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="help-topic-print-pdf"
            onClick={() => {
              printHelpTopicPage();
            }}
          >
            Print / Save as PDF
          </Button>
        </>
      )}
    </div>
  );
}
