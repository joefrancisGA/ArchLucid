"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_LAST_VALIDATION_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SummaryMetric(props: { readonly label: string; readonly value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.value}</p>
    </div>
  );
}

export type IdentityProvidersOverviewSummaryRowProps = {
  readonly overview: IdentityProvidersOverviewModel;
  readonly loading: boolean;
};

export function IdentityProvidersOverviewSummaryRow(props: IdentityProvidersOverviewSummaryRowProps): React.JSX.Element {
  const value = (label: string): string => (props.loading ? "…" : label);

  return (
    <section className="space-y-3" data-testid="identity-providers-overview-summary">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL} value={value(props.overview.authenticationModeLabel)} />
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL} value={value(props.overview.ssoStatus)} />
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL} value={value(props.overview.samlStatus)} />
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL} value={value(props.overview.oidcStatus)} />
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL} value={value(props.overview.roleMappingStatus)} />
        <SummaryMetric label={IDENTITY_PROVIDERS_SUMMARY_LAST_VALIDATION_LABEL} value={value(props.overview.lastValidationLabel)} />
      </div>

      <Card data-testid="identity-providers-recommended-next-card">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL}</CardTitle>
        </CardHeader>
        <CardContent>
          {props.loading ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading status…</p>
          ) : props.overview.recommendedNextHref !== null ? (
            <Link href={props.overview.recommendedNextHref} className={cn("font-medium", OPERATOR_LINK.inline)}>
              {props.overview.recommendedNextStep}
            </Link>
          ) : (
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.overview.recommendedNextStep}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
