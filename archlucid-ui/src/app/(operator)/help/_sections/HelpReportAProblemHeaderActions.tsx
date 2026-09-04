"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS } from "@/lib/report-a-problem-help-guide-content";

type HelpReportAProblemHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/report-a-problem` (HRE). */
export function HelpReportAProblemHeaderActions(
  props: HelpReportAProblemHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-report-a-problem-header-actions">
        <Button
          asChild
          size="sm"
          variant="primary"
          data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId}
        >
          <Link href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href}>
            {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.label}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-report-a-problem-header-actions">
      <Button
        asChild
        size="sm"
        variant="primary"
        data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId}
      >
        <Link href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href}>
          {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.label}
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.testId}
      >
        <a href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.href}>
          {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.label}
        </a>
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        data-testid={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.testId}
      >
        <Link href={REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.href}>
          {REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.troubleshooting.label}
        </Link>
      </Button>
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
