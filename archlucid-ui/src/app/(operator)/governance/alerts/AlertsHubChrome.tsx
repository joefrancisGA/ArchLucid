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
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { governanceAlertRulesTabHref, GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
        <LayerHeader pageKey="alerts" density="compact" />
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_ALERTS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.alerts}
        subtitle={alertsPageSubtitle(buyerPolishedShell)}
        titleTestId="alerts-page-title"
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
      <div className="min-w-0" data-testid="alert-hub-panel" aria-label="Alert inbox">
        {children}
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
