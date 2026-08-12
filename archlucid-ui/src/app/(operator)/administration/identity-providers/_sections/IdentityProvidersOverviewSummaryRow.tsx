"use client";

import { cn } from "@/lib/utils";
import {
  IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function SummaryMetric(props: {
  readonly label: string;
  readonly value: string;
  readonly caption?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.value}</p>
      {props.caption !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.caption}</p>
      ) : null}
    </div>
  );
}

export type IdentityProvidersOverviewSummaryRowProps = {
  readonly overview: IdentityProvidersOverviewModel;
  readonly loading: boolean;
};

export function IdentityProvidersOverviewSummaryRow(props: IdentityProvidersOverviewSummaryRowProps): React.JSX.Element {
  const value = (label: string): string => (props.loading ? "…" : label);
  const captions = props.overview.tileCaptions;

  return (
    <section className="space-y-3" data-testid="identity-providers-overview-summary">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL}
          value={value(props.overview.authenticationModeLabel)}
          caption={captions.authenticationMode}
        />
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL}
          value={value(props.overview.ssoStatus)}
          caption={captions.sso}
        />
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL}
          value={value(props.overview.samlStatus)}
          caption={captions.saml}
        />
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL}
          value={value(props.overview.oidcStatus)}
          caption={captions.oidc}
        />
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL}
          value={value(props.overview.roleMappingStatus)}
          caption={captions.roleMapping}
        />
        <SummaryMetric
          label={IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL}
          value={value(props.overview.validationStatusLabel)}
          caption={captions.validation}
        />
      </div>
    </section>
  );
}
