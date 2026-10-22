"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AZURE_BOARDS_TEST_CONNECTION_LABEL,
  AZURE_BOARDS_TEST_CONNECTION_LEAD,
  AZURE_BOARDS_TEST_CONNECTION_PENDING,
  AZURE_BOARDS_TEST_CONNECTION_TITLE,
} from "@/lib/azure-boards-page-copy";
import { cn } from "@/lib/utils";
import {
  azureBoardsConnectionTestCollapsedDisclosureHrefFromSearch,
  parseAzureBoardsConnectionTestCollapsedOpenFromSearch,
} from "@/lib/integrations/azure-boards-connection-test-collapsed-disclosure-url";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { resolveAzureBoardsConnectionTestGate, resolveAzureBoardsPageComposition } from "@/lib/azure-boards-integration-present";

export type AzureBoardsConnectionTestSectionProps = {
  readonly pageComposition: ReturnType<typeof resolveAzureBoardsPageComposition>;
  readonly testGate: ReturnType<typeof resolveAzureBoardsConnectionTestGate>;
  readonly testError: string | null;
  readonly isTesting: boolean;
  readonly credentialsReady: boolean;
  readonly connectionTestCollapsedSummary: string;
  readonly onRunConnectionTest: () => void;
};

export function AzureBoardsConnectionTestSection({
  pageComposition,
  testGate,
  testError,
  isTesting,
  credentialsReady,
  connectionTestCollapsedSummary,
  onRunConnectionTest,
}: AzureBoardsConnectionTestSectionProps): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const azureBoardsConnectionTestCollapsedOpenParam = searchParams.get("azureBoardsConnectionTestCollapsedOpen");
  const [collapsedOpen, setCollapsedOpenState] = useState(() =>
    parseAzureBoardsConnectionTestCollapsedOpenFromSearch(azureBoardsConnectionTestCollapsedOpenParam),
  );

  const syncCollapsedOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        azureBoardsConnectionTestCollapsedDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
      parseAzureBoardsConnectionTestCollapsedOpenFromSearch(azureBoardsConnectionTestCollapsedOpenParam),
    );
  }, [azureBoardsConnectionTestCollapsedOpenParam]);

  if (pageComposition.showConnectionTest) {
    return (
      <section
        aria-labelledby="azure-boards-test-heading"
        className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
        data-testid="azure-boards-connection-test"
      >
        <div>
          <h2 id="azure-boards-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {AZURE_BOARDS_TEST_CONNECTION_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {AZURE_BOARDS_TEST_CONNECTION_LEAD}
          </p>
        </div>

        {testError ? (
          <p className="m-0 text-red-600 dark:text-red-400" role="alert">
            {testError}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={onRunConnectionTest}
          disabled={!testGate.allowed || isTesting}
          data-testid="azure-boards-test-connection-button"
        >
          {isTesting ? AZURE_BOARDS_TEST_CONNECTION_PENDING : AZURE_BOARDS_TEST_CONNECTION_LABEL}
        </Button>
      </section>
    );
  }

  if (!pageComposition.blocked && pageComposition.connectionTestCollapsed) {
    return (
      <details
        id="azure-boards-test-heading"
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="azure-boards-connection-test-collapsed"
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
          {connectionTestCollapsedSummary}
        </summary>
        {testGate.reason ? (
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="azure-boards-test-disabled-reason">
            {testGate.reason}
          </p>
        ) : !credentialsReady ? (
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Save connection settings before running a connection test.
          </p>
        ) : null}
      </details>
    );
  }

  return null;
}
