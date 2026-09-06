"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { IdentityProvidersSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN_DETAIL,
  IDENTITY_PROVIDERS_SSO_SETUP_CTA_HREF,
  IDENTITY_PROVIDERS_SSO_SETUP_CTA_LABEL,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProviderCustomerStatus } from "@/lib/identity-providers-settings-types";
import { identityProviderCustomerStatusPresentation } from "@/lib/identity-provider-probe-status-presentation";
import {
  identityProvidersRelatedSurfacesDisclosureHrefFromSearch,
  parseIdentityProvidersRelatedSurfacesOpenFromSearch,
} from "@/lib/administration/identity-providers-related-surfaces-disclosure-url";

import { IdentityProvidersOverviewStatusFailureNotice } from "./IdentityProvidersOverviewStatusFailureNotice";
import { IdentityProvidersOverviewSummaryRow } from "./IdentityProvidersOverviewSummaryRow";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import {
  IDENTITY_PROVIDERS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  IDENTITY_PROVIDERS_SETTINGS_SKIP_TARGET_ID,
  IDENTITY_PROVIDERS_SETTINGS_START_HERE_CARD_TITLE,
  IDENTITY_PROVIDERS_SETTINGS_START_HERE_LEAD,
} from "./identity-providers-settings-page-copy";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersSettingsPageViewProps = {
  readonly model: UseIdentityProvidersSettingsPageModel;
};

const SIGN_IN_DOMAINS_HREF = "/administration/auth-domains" as const;
const SIGN_IN_DOMAINS_DESCRIPTION =
  "Verify email domains and enforce organization SSO routing." as const;

export function IdentityProvidersSettingsPageView(props: IdentityProvidersSettingsPageViewProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/identity-providers";
  const searchParams = useSearchParams();
  const identityProvidersRelatedSurfacesOpenParam = searchParams.get("identityProvidersRelatedSurfacesOpen");
  const { model } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [relatedSurfacesOpen, setRelatedSurfacesOpenState] = useState(() =>
    parseIdentityProvidersRelatedSurfacesOpenFromSearch(identityProvidersRelatedSurfacesOpenParam),
  );
  const showPrimaryNextStep =
    model.dataLoaded
    && model.overviewStatusFailure === null
    && model.overview.recommendedNextHref !== null
    && model.overview.recommendedNextHref !== IDENTITY_PROVIDERS_SSO_SETUP_CTA_HREF;

  const syncRelatedSurfacesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        identityProvidersRelatedSurfacesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRelatedSurfacesOpen = useCallback(
    (open: boolean) => {
      setRelatedSurfacesOpenState(open);
      syncRelatedSurfacesOpenToUrl(open);
    },
    [syncRelatedSurfacesOpenToUrl],
  );

  useEffect(() => {
    setRelatedSurfacesOpenState(parseIdentityProvidersRelatedSurfacesOpenFromSearch(identityProvidersRelatedSurfacesOpenParam));
  }, [identityProvidersRelatedSurfacesOpenParam]);

  const primaryNextStep = (
    <div className="space-y-2" data-testid="identity-providers-primary-next-step">
      {model.overviewStatusFailure !== null ? null : !model.dataLoaded ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading status…</p>
      ) : null}

      {model.dataLoaded && model.overviewStatusFailure === null && model.overview.headerStatusAvailable ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="identity-providers-sso-setup-cta">
          <Button variant="primary" size="sm" asChild data-testid="identity-providers-sso-setup-cta-button">
            <Link href={IDENTITY_PROVIDERS_SSO_SETUP_CTA_HREF}>{IDENTITY_PROVIDERS_SSO_SETUP_CTA_LABEL}</Link>
          </Button>
          <StatusTag
            kind={
              identityProviderCustomerStatusPresentation(
                model.overview.ssoStatus as IdentityProviderCustomerStatus,
              ).kind
            }
            label={model.overview.ssoStatus}
          />
        </div>
      ) : null}

      {showPrimaryNextStep ? (
        <Button variant="outline" size="sm" asChild data-testid="identity-providers-primary-next-step-button">
          <Link href={model.overview.recommendedNextHref!}>{model.overview.recommendedNextStep}</Link>
        </Button>
      ) : null}

      {showPrimaryNextStep && model.overview.usesLocalDevelopmentSignIn ? (
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN_DETAIL}
        </p>
      ) : null}

      {model.dataLoaded ? (
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)} data-testid="identity-providers-sign-in-domains-link">
          <Link href={SIGN_IN_DOMAINS_HREF} className={OPERATOR_LINK.nav}>
            Sign-in domains
          </Link>
          <span className="text-al-text-secondary"> — {SIGN_IN_DOMAINS_DESCRIPTION}</span>
        </p>
      ) : null}

      {!buyerPolishedShell ? (
        <div
          className={cn(
            "rounded-md border border-neutral-200 px-3 py-2 text-al-text-primary dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="identity-providers-admin-fallback-notice"
        >
          {IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE}
        </div>
      ) : null}
    </div>
  );

  return (
    <IdentityProvidersSettingsShell
      refreshing={model.refreshing}
      lastRefreshedAt={model.lastRefreshedAt}
      overview={model.overview}
      statusBadgeReady={model.dataLoaded}
      diagnosticsDataUnavailable={model.diagnosticsDataUnavailable}
      onRefresh={() => void model.refresh()}
    >
      <div
        id={buyerPolishedShell ? IDENTITY_PROVIDERS_SETTINGS_SKIP_TARGET_ID : undefined}
        data-testid={buyerPolishedShell ? IDENTITY_PROVIDERS_SETTINGS_FIRST_VIEWPORT_TEST_ID : undefined}
        className={
          buyerPolishedShell
            ? cn(
                "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )
            : undefined
        }
      >
        {buyerPolishedShell ? (
          <section
            className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="identity-providers-action-panel"
            aria-labelledby="identity-providers-action-panel-heading"
          >
            <h2
              id="identity-providers-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {IDENTITY_PROVIDERS_SETTINGS_START_HERE_CARD_TITLE}
            </h2>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {IDENTITY_PROVIDERS_SETTINGS_START_HERE_LEAD}
            </p>
          </section>
        ) : null}

        {!buyerPolishedShell ? <IdentityProvidersSettingsEvidenceOrientationStrip /> : null}

        {model.overviewStatusFailure !== null ? (
          <IdentityProvidersOverviewStatusFailureNotice
            failure={model.overviewStatusFailure}
            refreshing={model.refreshing}
            onRefresh={() => void model.refresh()}
          />
        ) : null}

        {primaryNextStep}

        <IdentityProvidersOverviewSummaryRow overview={model.overview} loading={!model.dataLoaded} />
      </div>

      {!buyerPolishedShell ? (
        <details
          className="rounded-lg border border-neutral-200 dark:border-neutral-800"
          data-testid="identity-providers-related-surfaces-disclosure"
          open={relatedSurfacesOpen}
          onToggle={(event) => {
            setRelatedSurfacesOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
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
      ) : null}

      {buyerPolishedShell ? (
        <div data-testid="identity-providers-orientation-bottom">
          <IdentityProvidersSettingsEvidenceOrientationStrip />
        </div>
      ) : null}
    </IdentityProvidersSettingsShell>
  );
}
