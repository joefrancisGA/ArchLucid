"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  SERVICENOW_CONNECTION_TEST_BUTTON,
  SERVICENOW_CONNECTION_TEST_COLLAPSED_SUMMARY,
  SERVICENOW_CONNECTION_TEST_LEAD,
  SERVICENOW_CONNECTION_TEST_PENDING,
  SERVICENOW_CONNECTION_TEST_TITLE,
  SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL,
} from "@/lib/servicenow-integration-page-copy";
import type { resolveServiceNowConnectionTestGate, resolveServiceNowPageComposition } from "@/lib/servicenow-integration-present";
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  parseServiceNowConnectionTestCollapsedOpenFromSearch,
  serviceNowConnectionTestCollapsedDisclosureHrefFromSearch,
} from "@/lib/integrations/servicenow-connection-test-collapsed-disclosure-url";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ServiceNowConnectionTestPanelProps = {
  readonly pageComposition: ReturnType<typeof resolveServiceNowPageComposition>;
  readonly testGate: ReturnType<typeof resolveServiceNowConnectionTestGate>;
  readonly testError: string | null;
  readonly isTesting: boolean;
  readonly onRunConnectionTest: () => void;
};

export function ServiceNowConnectionTestPanel({
  pageComposition,
  testGate,
  testError,
  isTesting,
  onRunConnectionTest,
}: ServiceNowConnectionTestPanelProps): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const serviceNowConnectionTestCollapsedOpenParam = searchParams.get("serviceNowConnectionTestCollapsedOpen");
  const [collapsedOpen, setCollapsedOpenState] = useState(() =>
    parseServiceNowConnectionTestCollapsedOpenFromSearch(serviceNowConnectionTestCollapsedOpenParam),
  );

  const syncCollapsedOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        serviceNowConnectionTestCollapsedDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setCollapsedOpen = useCallback(
    (open: boolean) => {
      setCollapsedOpenState(open);
      syncCollapsedOpenToUrl(open);
    },
    [syncCollapsedOpenToUrl],
  );

  useEffect(() => {
    setCollapsedOpenState(
      parseServiceNowConnectionTestCollapsedOpenFromSearch(serviceNowConnectionTestCollapsedOpenParam),
    );
  }, [serviceNowConnectionTestCollapsedOpenParam]);

  const connectionTestBody = (
    <>
      {testError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {testError}
        </p>
      ) : null}

      {!testGate.allowed && testGate.reason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="servicenow-test-disabled-reason">
          {testGate.reason}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onRunConnectionTest}
        disabled={!testGate.allowed}
        aria-describedby={!testGate.allowed ? "servicenow-test-disabled-reason" : undefined}
      >
        {isTesting ? SERVICENOW_CONNECTION_TEST_PENDING : SERVICENOW_CONNECTION_TEST_BUTTON}
      </Button>

      <p className="m-0">
        <Link href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF} className={cn(OPERATOR_LINK.inline)}>
          {SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL}
        </Link>
      </p>
    </>
  );

  if (pageComposition.showConnectionTest) {
    return (
      <section
        aria-labelledby="servicenow-test-heading"
        className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
        data-testid="servicenow-connection-test"
      >
        <div>
          <h2 id="servicenow-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {SERVICENOW_CONNECTION_TEST_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {SERVICENOW_CONNECTION_TEST_LEAD}
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
        data-testid="servicenow-connection-test-collapsed"
        open={collapsedOpen}
        onToggle={(event) => {
          setCollapsedOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary
          className={cn(
            "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
        >
          {SERVICENOW_CONNECTION_TEST_COLLAPSED_SUMMARY}
        </summary>
        <div className="mt-3 space-y-3">
          {connectionTestBody}
        </div>
      </details>
    );
  }

  return null;
}
