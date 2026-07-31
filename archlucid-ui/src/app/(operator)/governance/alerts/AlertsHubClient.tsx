"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { LayerHeader } from "@/components/LayerHeader";
import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  alertsPageSubtitle,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_LAYER_GUIDANCE_TRIGGER,
} from "@/lib/alerts-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";

import type { AlertsInboxPageModel } from "./_sections/alerts-inbox-page-model";

export type AlertsHubClientProps = {
  readonly initialInboxModel?: AlertsInboxPageModel | null;
};

/** Alerts triage inbox — rule configuration lives on `/governance/alert-rules`. */
export function AlertsHubClient({ initialInboxModel = null }: AlertsHubClientProps = {}) {
  const canMutateAlertInbox = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="px-0">
      {buyerPolishedShell ? (
        <LayerHeader pageKey="alerts" density="compact" collapsibleGuidance={ALERTS_LAYER_GUIDANCE_TRIGGER} />
      ) : null}

      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.alerts}
        subtitle={alertsPageSubtitle(buyerPolishedShell)}
        titleTestId="alerts-page-title"
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="alerts-hub-header-actions">
            <PageContextualHelpButton />
            <Link
              href={governanceAlertRulesTabHref("rules")}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
              data-testid="alerts-configure-rules-link"
            >
              {ALERTS_CONFIGURE_RULES_LINK_LABEL}
            </Link>
          </div>
        }
      >
        {!buyerPolishedShell ? <AlertsGovernanceContextPanel canMutateAlertInbox={canMutateAlertInbox} /> : null}
      </OperatorPageHeader>

      <div className="min-w-0" data-testid="alert-hub-panel" aria-label="Alert inbox">
        <AlertsInboxContent initialModel={initialInboxModel} />
      </div>
    </div>
  );
}
