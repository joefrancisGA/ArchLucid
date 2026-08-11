"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_NAV_DIAGNOSTICS,
  IDENTITY_PROVIDERS_NAV_OIDC,
  IDENTITY_PROVIDERS_NAV_ROLE_MAPPING,
  IDENTITY_PROVIDERS_NAV_SAML,
  IDENTITY_PROVIDERS_OVERVIEW_CONFIGURE_LINKS_TITLE,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
} from "@/lib/identity-providers-settings-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { IdentityProvidersOverviewSummaryRow } from "./IdentityProvidersOverviewSummaryRow";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersSettingsPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

const CONFIGURATION_AREAS = [
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
      onRefresh={() => void model.refresh()}
    >
      <IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="identity-providers" />
      <ScimIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />
      <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="identity-providers" />
      {model.note !== null ? (
        <p
          className={cn("m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}
          data-testid="identity-providers-note"
          role="alert"
        >
          {model.note}
        </p>
      ) : null}

      {model.overview.usesLocalDevelopmentSignIn ? (
        <Card data-testid="identity-providers-local-dev-notice">
          <CardContent className={cn("py-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              <strong className="font-medium text-al-text-primary">Local development sign-in</strong> is enabled for this
              workspace. {IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN} before inviting shared users.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <IdentityProvidersOverviewSummaryRow overview={model.overview} loading={!model.dataLoaded} />

      <Card data-testid="identity-providers-overview-links">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{IDENTITY_PROVIDERS_OVERVIEW_CONFIGURE_LINKS_TITLE}</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE}
      </p>
    </IdentityProvidersSettingsShell>
  );
}
