"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { LayerHeader } from "@/components/LayerHeader";
import { AlertsGovernanceContextPanelDeferred } from "@/components/alerts/alerts-inbox-deferred-chunks";
import {
  AlertsHubHeaderConfigureLinkProvider,
  useAlertsHubHeaderConfigureLinkVisibility,
} from "@/components/alerts/AlertsHubHeaderConfigureLinkContext";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  alertsPageSubtitle,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
} from "@/lib/alerts-page-copy";
import {
  ALERTS_INBOX_PRIMARY_CONTENT_ID,
  ALERTS_INBOX_SKIP_LINK_LABEL,
} from "@/lib/alerts-inbox-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LINK,
} from "@/lib/design-tokens";
import { governanceAlertRulesTabHref, GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { AlertsHubBreadcrumb } from "./AlertsHubBreadcrumb";
import { AlertsHubBuyerChrome } from "./AlertsHubBuyerChrome";
import { ALERTS_INBOX_CLAIM_DISCIPLINE } from "@/lib/alerts-inbox-evidence-copy";

type AlertsHubChromeProps = {
  readonly children: React.ReactNode;
  /**
   * Optional force for tests. When omitted, visibility is driven by the inbox via
   * {@link AlertsHubHeaderConfigureLinkProvider} (TB-2103).
   */
  readonly showHeaderConfigureLink?: boolean;
};

function AlertsHubChromeInner({
  children,
  showHeaderConfigureLinkOverride,
}: {
  readonly children: React.ReactNode;
  readonly showHeaderConfigureLinkOverride?: boolean;
}): React.JSX.Element {
  const canMutateAlertInbox = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showFromInbox = useAlertsHubHeaderConfigureLinkVisibility();
  const showHeaderConfigureLink = showHeaderConfigureLinkOverride ?? showFromInbox;

  return (
    <div className="px-0">
      {buyerPolishedShell ? (
        <a
          href={`#${ALERTS_INBOX_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {ALERTS_INBOX_SKIP_LINK_LABEL}
        </a>
      ) : null}

      {buyerPolishedShell ? (
        <LayerHeader pageKey="alerts" density="compact" />
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_ALERTS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.alerts}
        subtitle={alertsPageSubtitle(buyerPolishedShell)}
        claimDiscipline={ALERTS_INBOX_CLAIM_DISCIPLINE}
        claimDisciplineTestId="alerts-inbox-claim-discipline"
        titleTestId="alerts-page-title"
        breadcrumb={buyerPolishedShell ? <AlertsHubBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="alerts-hub-header-actions">
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            {showHeaderConfigureLink ? (
              <Link
                href={governanceAlertRulesTabHref("rules")}
                className={OPERATOR_LINK.optional}
                data-testid="alerts-configure-rules-link"
              >
                {ALERTS_CONFIGURE_RULES_LINK_LABEL}
              </Link>
            ) : null}
          </div>
        }
      >
        {!buyerPolishedShell ? (
          <AlertsGovernanceContextPanelDeferred canMutateAlertInbox={canMutateAlertInbox} />
        ) : null}
      </OperatorPageHeader>

      <div
        id={buyerPolishedShell ? ALERTS_INBOX_PRIMARY_CONTENT_ID : undefined}
        className={cn("min-w-0", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid={buyerPolishedShell ? "alerts-inbox-primary-content" : "alert-hub-panel"}
        aria-label="Alert inbox"
      >
        {children}
        {buyerPolishedShell ? <AlertsHubBuyerChrome /> : null}
      </div>
    </div>
  );
}

/** Alerts hub header/chrome — paints immediately while inbox streams under Suspense (TB-2026). */
export function AlertsHubChrome({
  children,
  showHeaderConfigureLink,
}: AlertsHubChromeProps): React.JSX.Element {
  return (
    <AlertsHubHeaderConfigureLinkProvider>
      <AlertsHubChromeInner showHeaderConfigureLinkOverride={showHeaderConfigureLink}>
        {children}
      </AlertsHubChromeInner>
    </AlertsHubHeaderConfigureLinkProvider>
  );
}
