"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { AlertsInboxPageModel } from "./_sections/alerts-inbox-page-model";

export type AlertsHubClientProps = {
  readonly initialInboxModel?: AlertsInboxPageModel | null;
};

/** Alerts triage inbox — rule configuration lives on `/governance/alert-rules`. */
export function AlertsHubClient({ initialInboxModel = null }: AlertsHubClientProps = {}) {
  const canMutateAlertInbox = useOperateCapability();

  return (
    <div className="px-0">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.alerts}
        subtitle={ALERTS_PAGE_SUBTITLE}
        titleTestId="alerts-page-title"
        actions={<PageContextualHelpButton />}
      >
        <AlertsGovernanceContextPanel canMutateAlertInbox={canMutateAlertInbox} />
      </OperatorPageHeader>

      <div className="min-w-0" data-testid="alert-hub-panel" aria-label="Alert inbox">
        <AlertsInboxContent initialModel={initialInboxModel} />
      </div>
    </div>
  );
}
