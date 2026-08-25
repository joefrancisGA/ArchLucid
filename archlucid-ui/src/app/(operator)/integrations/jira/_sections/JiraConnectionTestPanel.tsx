"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  JIRA_CONNECTION_TEST_BUTTON,
  JIRA_CONNECTION_TEST_COLLAPSED_SUMMARY,
  JIRA_CONNECTION_TEST_LEAD,
  JIRA_CONNECTION_TEST_PENDING,
  JIRA_CONNECTION_TEST_TITLE,
  JIRA_CONNECTION_VERIFICATION_HELP_LABEL,
} from "@/lib/jira-integration-page-copy";
import type { resolveJiraConnectionTestGate, resolveJiraPageComposition } from "@/lib/jira-integration-present";
import { ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED } from "@/lib/itsm/itsm-product-integration-page-copy";
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type JiraConnectionTestPanelProps = {
  readonly pageComposition: ReturnType<typeof resolveJiraPageComposition>;
  readonly testGate: ReturnType<typeof resolveJiraConnectionTestGate>;
  readonly testError: string | null;
  readonly isTesting: boolean;
  readonly onRunConnectionTest: () => void;
};

export function JiraConnectionTestPanel({
  pageComposition,
  testGate,
  testError,
  isTesting,
  onRunConnectionTest,
}: JiraConnectionTestPanelProps): React.ReactElement | null {
  const connectionTestBody = (
    <>
      {testError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {testError}
        </p>
      ) : null}

      {!testGate.allowed && testGate.reason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="jira-test-disabled-reason">
          {testGate.reason}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onRunConnectionTest}
        disabled={!testGate.allowed}
        aria-describedby={!testGate.allowed ? "jira-test-disabled-reason" : undefined}
      >
        {isTesting ? JIRA_CONNECTION_TEST_PENDING : JIRA_CONNECTION_TEST_BUTTON}
      </Button>

      <p className="m-0">
        <Link href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF} className={cn(OPERATOR_LINK.inline)}>
          {JIRA_CONNECTION_VERIFICATION_HELP_LABEL}
        </Link>
      </p>
    </>
  );

  if (pageComposition.showConnectionTest) {
    return (
      <section
        aria-labelledby="jira-test-heading"
        className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
        data-testid="jira-connection-test"
      >
        <div>
          <h2 id="jira-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {JIRA_CONNECTION_TEST_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {JIRA_CONNECTION_TEST_LEAD}
          </p>
        </div>

        {connectionTestBody}
      </section>
    );
  }

  if (pageComposition.connectionTestCollapsed) {
    return (
      <details
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="jira-connection-test-collapsed"
      >
        <summary
          className={cn(
            "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
        >
          {JIRA_CONNECTION_TEST_COLLAPSED_SUMMARY}
        </summary>
        <div className="mt-3 space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED}
          </p>
        </div>
      </details>
    );
  }

  return null;
}
