"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SSO_WIZARD_EXISTING_CONFIG_SUMMARY_TITLE } from "@/lib/sso-wizard-copy";
import { cn } from "@/lib/utils";

import type { SsoWizardExistingConfigSummary as SsoWizardExistingConfigSummaryModel } from "./sso-wizard-tenant-config";

export type SsoWizardExistingConfigSummaryProps = {
  readonly summary: SsoWizardExistingConfigSummaryModel;
};

export function SsoWizardExistingConfigSummary(props: SsoWizardExistingConfigSummaryProps): React.JSX.Element {
  const { summary } = props;

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="sso-wizard-existing-config-summary"
      aria-labelledby="sso-wizard-existing-config-summary-title"
    >
      <h3
        id="sso-wizard-existing-config-summary-title"
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {SSO_WIZARD_EXISTING_CONFIG_SUMMARY_TITLE}
      </h3>
      <dl className="m-0 mt-3 grid gap-2">
        <div>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Protocol</dt>
          <dd className="m-0 text-al-text-primary">{summary.protocolLabel}</dd>
        </div>
        <div>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Issuer</dt>
          <dd className="m-0 break-all text-al-text-primary">{summary.issuerUri}</dd>
        </div>
        <div>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Record status</dt>
          <dd className="m-0">
            <StatusTag kind={summary.isActive ? "ready" : "neutral"} label={summary.isActive ? "Active" : "Stored"} />
          </dd>
        </div>
        <div>
          <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Mapped roles</dt>
          <dd className="m-0 text-al-text-primary">{summary.mappedRoleCount}</dd>
        </div>
        {summary.updatedUtc !== null ? (
          <div>
            <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Last updated</dt>
            <dd className="m-0 text-al-text-primary">{new Date(summary.updatedUtc).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
