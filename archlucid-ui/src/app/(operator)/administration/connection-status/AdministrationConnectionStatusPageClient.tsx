"use client";

import Link from "next/link";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { ConnectionStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  administrationConnectionStatusPageSubtitle,
  ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID,
  ADMINISTRATION_CONNECTION_STATUS_SKIP_LINK_LABEL,
  ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID,
} from "@/lib/administration-connection-status-page-copy";
import { CONNECTION_STATUS_CLAIM_DISCIPLINE } from "@/lib/connection-status-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_READINESS_PATH, INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import { cn } from "@/lib/utils";

/** Administration connection status hub for `/administration/connection-status` (ADC). */
export function AdministrationConnectionStatusPageClient(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageContainer variant="workflow" className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}>
      <a
        href={`#${ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ADMINISTRATION_CONNECTION_STATUS_SKIP_LINK_LABEL}
      </a>

      <div
        id={ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID}
        data-testid={ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={INTEGRATIONS_READINESS_PATH}
          title={OPERATOR_NAV_LINK_LABELS.connectionStatus}
          subtitle={administrationConnectionStatusPageSubtitle(buyerPolishedShell)}
          claimDiscipline={CONNECTION_STATUS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={
            buyerPolishedShell ? null : (
              <>
                <p
                  className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="connection-status-related-surfaces"
                >
                  Related:{" "}
                  <Link href={CLOUD_CONNECTIONS_PATH} className={cn(OPERATOR_LINK.inline, "font-medium")}>
                    Cloud connections
                  </Link>
                  {" · "}
                  <Link href={INTEGRATIONS_WEBHOOKS_PATH} className={cn(OPERATOR_LINK.inline, "font-medium")}>
                    Webhooks
                  </Link>
                </p>
                <PageContextualHelpButton />
              </>
            )
          }
        />

        <div
          id={ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID}
          data-testid={ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <ConnectorOperationsDashboard />
        </div>

        <div data-testid="connection-status-orientation-bottom">
          <ConnectionStatusEvidenceOrientationStrip />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
