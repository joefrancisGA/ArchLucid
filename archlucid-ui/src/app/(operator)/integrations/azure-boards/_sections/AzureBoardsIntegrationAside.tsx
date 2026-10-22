"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { StatusTag } from "@/components/ui/status-tag";
import {
  resolveAzureBoardsIntegrationConnectSteps,
  resolveAzureBoardsIntegrationEmphasizedStepId,
} from "@/lib/azure-boards-integration-connect-checklist";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE,
  AZURE_BOARDS_HELP_TOPIC_HREF,
  AZURE_BOARDS_HELP_TOPIC_LABEL,
  AZURE_BOARDS_LATEST_TEST_FAILED_LABEL,
  AZURE_BOARDS_LATEST_TEST_PASSED_LABEL,
  AZURE_BOARDS_LATEST_TEST_TITLE,
  AZURE_BOARDS_PERMISSIONS_ASIDE_BODY,
  AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE,
  AZURE_BOARDS_SETUP_PROGRESS_TITLE,
  AZURE_BOARDS_TROUBLESHOOTING_HELP_LABEL,
} from "@/lib/azure-boards-page-copy";
import type { AzureBoardsConnectionStatusPresentation } from "@/lib/azure-boards-integration-present";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import {
  azureBoardsPlatformNotesDisclosureHrefFromSearch,
  parseAzureBoardsPlatformNotesOpenFromSearch,
} from "@/lib/integrations/azure-boards-platform-notes-disclosure-url";

type Props = {
  readonly status: AzureBoardsConnectionStatusPresentation;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly connectionVerified: boolean;
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly showOperatorNotes: boolean;
  readonly nativeEnabled: boolean;
};

export function AzureBoardsIntegrationAside(props: Props): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const azureBoardsPlatformNotesOpenParam = searchParams.get("azureBoardsPlatformNotesOpen");
  const [platformNotesOpen, setPlatformNotesOpenState] = useState(() =>
    parseAzureBoardsPlatformNotesOpenFromSearch(azureBoardsPlatformNotesOpenParam),
  );

  const syncPlatformNotesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(azureBoardsPlatformNotesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPlatformNotesOpen = useCallback(
    (open: boolean) => {
      setPlatformNotesOpenState(open);
      syncPlatformNotesOpenToUrl(open);
    },
    [syncPlatformNotesOpenToUrl],
  );

  useEffect(() => {
    setPlatformNotesOpenState(parseAzureBoardsPlatformNotesOpenFromSearch(azureBoardsPlatformNotesOpenParam));
  }, [azureBoardsPlatformNotesOpenParam]);

  const connectSteps = resolveAzureBoardsIntegrationConnectSteps({
    credentialsReady: props.credentialsReady,
    settingsReady: props.settingsReady,
    connectionVerified: props.connectionVerified,
  });
  const emphasizedStepId = resolveAzureBoardsIntegrationEmphasizedStepId({
    credentialsReady: props.credentialsReady,
    settingsReady: props.settingsReady,
    connectionVerified: props.connectionVerified,
  });

  return (
    <aside
      className="space-y-4"
      data-testid="azure-boards-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <IntegrationConnectChecklist
        title={AZURE_BOARDS_SETUP_PROGRESS_TITLE}
        steps={connectSteps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="azure-boards"
      />

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_PERMISSIONS_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_BOARDS_PERMISSIONS_ASIDE_BODY}
        </p>
      </div>

      {props.lastTestAt !== null ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="azure-boards-latest-test"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_LATEST_TEST_TITLE}</h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <time dateTime={props.lastTestAt}>{new Date(props.lastTestAt).toLocaleString()}</time>
          </p>
          {props.lastTestSummary ? (
            <div className="mt-2 space-y-2">
              <StatusTag
                kind={props.lastTestSuccess === false ? "needs-attention" : "ready"}
                label={
                  props.lastTestSuccess === false
                    ? AZURE_BOARDS_LATEST_TEST_FAILED_LABEL
                    : AZURE_BOARDS_LATEST_TEST_PASSED_LABEL
                }
              />
              <p
                role={props.lastTestSuccess === false ? "alert" : "status"}
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {props.lastTestSummary}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_BOARDS_DOCUMENTATION_ASIDE_TITLE}</h2>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          <li>
            <Link
              href={AZURE_BOARDS_HELP_TOPIC_HREF}
              className={cn(OPERATOR_LINK.inline)}
              data-testid="azure-boards-help-guide-link"
            >
              {AZURE_BOARDS_HELP_TOPIC_LABEL}
            </Link>
          </li>
          <li>
            <Link href={inAppHelpHref("troubleshooting")} className={cn(OPERATOR_LINK.inline)}>
              {AZURE_BOARDS_TROUBLESHOOTING_HELP_LABEL}
            </Link>
          </li>
        </ul>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection title="Platform administrator notes" open={platformNotesOpen} onToggle={setPlatformNotesOpen}>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Native work item creation from findings is {props.nativeEnabled ? "enabled" : "disabled"} for this
            deployment.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
