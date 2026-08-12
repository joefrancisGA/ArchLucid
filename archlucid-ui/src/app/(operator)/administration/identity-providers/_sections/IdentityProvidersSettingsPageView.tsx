"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import { Button } from "@/components/ui/button";
import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_NAV_DIAGNOSTICS,
  IDENTITY_PROVIDERS_NAV_OIDC,
  IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
  IDENTITY_PROVIDERS_NAV_SAML,
  IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE,
  IDENTITY_PROVIDERS_OVERVIEW_CONFIGURE_LINKS_TITLE,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN_DETAIL,
} from "@/lib/identity-providers-settings-copy";
import { IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK } from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { IdentityProvidersOverviewStatusFailureNotice } from "./IdentityProvidersOverviewStatusFailureNotice";
import { IdentityProvidersOverviewSummaryRow } from "./IdentityProvidersOverviewSummaryRow";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersSettingsPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

const CONFIGURATION_AREAS = [
  {
    href: IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK.href,
    label: IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK.label,
    description: IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK.whenToUse,
  },
  {
    href: "/administration/auth-domains",
    label: "Sign-in domains",
    description: "Verify email domains and enforce organization SSO routing.",
  },
  {
    href: "/administration/identity-providers/saml",
    label: IDENTITY_PROVIDERS_NAV_SAML,
    description: "Configure SAML metadata, issuer, and group-to-role mapping.",
  },
  {
    href: "/administration/identity-providers/oidc",
    label: IDENTITY_PROVIDERS_NAV_OIDC,
    description: "Review OIDC authority, audience, and discovery status.",
  },
  {
    href: "/administration/identity-providers/role-mapping",
    label: IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
    description: "Validate how identity provider groups map to workspace roles.",
  },
  {
    href: "/administration/identity-providers/diagnostics",
    label: IDENTITY_PROVIDERS_NAV_DIAGNOSTICS,
    description: "Run health checks and technical validation when troubleshooting sign-in.",
  },
] as const;

export function IdentityProvidersSettingsPageView(props: IdentityProvidersSettingsPageViewProps): React.JSX.Element {
  const { model } = props;

  return (
    <IdentityProvidersSettingsShell
      refreshing={model.refreshing}
      lastRefreshedAt={model.lastRefreshedAt}
      overview={model.overview}
      statusBadgeReady={model.dataLoaded}
      diagnosticsDataUnavailable={model.diagnosticsDataUnavailable}
      onRefresh={() => void model.refresh()}
    >
      {model.overviewStatusFailure !== null ? (
        <IdentityProvidersOverviewStatusFailureNotice
          failure={model.overviewStatusFailure}
          refreshing={model.refreshing}
          onRefresh={() => void model.refresh()}
        />
      ) : null}

      {!model.dataLoaded ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading status…</p>
      ) : model.overview.recommendedNextHref !== null ? (
        <div className="space-y-2" data-testid="identity-providers-primary-next-step">
          <Button asChild data-testid="identity-providers-primary-next-step-button">
            <Link href={model.overview.recommendedNextHref}>{model.overview.recommendedNextStep}</Link>
          </Button>
          {model.overview.usesLocalDevelopmentSignIn ? (
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN_DETAIL}
            </p>
          ) : null}
        </div>
      ) : null}

      <IdentityProvidersOverviewSummaryRow overview={model.overview} loading={!model.dataLoaded} />

      <section className="space-y-3" data-testid="identity-providers-overview-links">
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {IDENTITY_PROVIDERS_OVERVIEW_CONFIGURE_LINKS_TITLE}
        </h2>
        <ul className="m-0 list-none space-y-3 p-0">
          {CONFIGURATION_AREAS.map((area) => (
            <li key={area.href}>
              <Link href={area.href} className={cn("block rounded-md border border-neutral-200 p-3 dark:border-neutral-800", OPERATOR_LINK.nav)}>
                <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{area.label}</span>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{area.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <details
        className="rounded-lg border border-neutral-200 dark:border-neutral-800"
        data-testid="identity-providers-related-surfaces-disclosure"
      >
        <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE}
        </summary>
        <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="identity-providers" />
          <ScimIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />
          <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />
        </div>
      </details>

      <p className={cn("m-0 max-w-3xl text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="identity-providers-admin-fallback-notice">
        {IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE}
      </p>
    </IdentityProvidersSettingsShell>
  );
}
