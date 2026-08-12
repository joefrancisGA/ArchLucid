"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import {
  IDENTITY_PROVIDERS_OVERVIEW_SIGN_IN_STATUS_TITLE,
  IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL,
  IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL,
  IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProviderCustomerStatus, IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import {
  identityProviderCustomerStatusPresentation,
  type IdentityProviderStatusPresentation,
} from "@/lib/identity-provider-probe-status-presentation";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SIGN_IN_STATUS_HEADING_ID = "identity-providers-sign-in-status-heading";

function validationStatusPresentation(label: string): IdentityProviderStatusPresentation {
  if (label === IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET) {
    return { kind: "neutral", label };
  }

  return identityProviderCustomerStatusPresentation(label as IdentityProviderCustomerStatus);
}

function StatusSummaryTile(props: {
  readonly term: string;
  readonly presentation: IdentityProviderStatusPresentation;
  readonly caption?: string;
  readonly href?: string;
  readonly loading: boolean;
  readonly testId: string;
}): React.JSX.Element {
  const statusTag = props.loading ? (
    <span className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>…</span>
  ) : (
    <StatusTag kind={props.presentation.kind} label={props.presentation.label} />
  );

  const statusValue =
    props.href !== undefined && !props.loading ? (
      <Link href={props.href} className={cn("inline-flex rounded-sm", OPERATOR_LINK.nav)}>
        {statusTag}
      </Link>
    ) : (
      statusTag
    );

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
      data-testid={props.testId}
    >
      <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.term}</dt>
      <dd className="m-0 mt-1">{statusValue}</dd>
      {props.caption !== undefined ? (
        <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.caption}</dd>
      ) : null}
    </div>
  );
}

function PlainTextSummaryTile(props: {
  readonly term: string;
  readonly value: string;
  readonly caption?: string;
  readonly loading: boolean;
  readonly testId: string;
}): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
      data-testid={props.testId}
    >
      <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.term}</dt>
      <dd className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.loading ? "…" : props.value}
      </dd>
      {props.caption !== undefined ? (
        <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.caption}</dd>
      ) : null}
    </div>
  );
}

export type IdentityProvidersOverviewSummaryRowProps = {
  readonly overview: IdentityProvidersOverviewModel;
  readonly loading: boolean;
};

export function IdentityProvidersOverviewSummaryRow(props: IdentityProvidersOverviewSummaryRowProps): React.JSX.Element {
  const captions = props.overview.tileCaptions;

  return (
    <section
      className="space-y-3"
      data-testid="identity-providers-overview-summary"
      aria-labelledby={SIGN_IN_STATUS_HEADING_ID}
    >
      <h2
        id={SIGN_IN_STATUS_HEADING_ID}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {IDENTITY_PROVIDERS_OVERVIEW_SIGN_IN_STATUS_TITLE}
      </h2>
      <dl className="m-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PlainTextSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL}
          value={props.overview.authenticationModeLabel}
          caption={captions.authenticationMode}
          loading={props.loading}
          testId="identity-providers-overview-tile-authentication-mode"
        />
        <StatusSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL}
          presentation={identityProviderCustomerStatusPresentation(props.overview.ssoStatus)}
          caption={captions.sso}
          href="/administration/identity-providers/diagnostics"
          loading={props.loading}
          testId="identity-providers-overview-tile-sso"
        />
        <StatusSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL}
          presentation={identityProviderCustomerStatusPresentation(props.overview.samlStatus)}
          caption={captions.saml}
          href="/administration/identity-providers/saml"
          loading={props.loading}
          testId="identity-providers-overview-tile-saml"
        />
        <StatusSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL}
          presentation={identityProviderCustomerStatusPresentation(props.overview.oidcStatus)}
          caption={captions.oidc}
          href="/administration/identity-providers/oidc"
          loading={props.loading}
          testId="identity-providers-overview-tile-oidc"
        />
        <StatusSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL}
          presentation={identityProviderCustomerStatusPresentation(props.overview.roleMappingStatus)}
          caption={captions.roleMapping}
          href="/administration/identity-providers/role-mapping"
          loading={props.loading}
          testId="identity-providers-overview-tile-role-mapping"
        />
        <StatusSummaryTile
          term={IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL}
          presentation={validationStatusPresentation(props.overview.validationStatusLabel)}
          caption={captions.validation}
          href="/administration/identity-providers/diagnostics"
          loading={props.loading}
          testId="identity-providers-overview-tile-validation"
        />
      </dl>
    </section>
  );
}
