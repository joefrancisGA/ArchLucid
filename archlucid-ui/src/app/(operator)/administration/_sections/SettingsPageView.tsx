"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AdminPrerequisitesReadinessBoard } from "@/components/administration/AdminPrerequisitesReadinessBoard";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsHubEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-settings-strips";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { cn } from "@/lib/utils";

import { SETTINGS_MASTER_SECTIONS, settingsMasterSectionDomId } from "./settings-master-catalog";
import { buildSettingsMasterVisibleSections } from "./settings-master-page-model";
import { SettingsMasterDestinationCard } from "./SettingsMasterDestinationCard";
import { SettingsMasterOverviewHeader } from "./SettingsMasterOverviewHeader";
import { SettingsMasterSearchField } from "./SettingsMasterSearchField";
import { SettingsMasterSectionNav } from "./SettingsMasterSectionNav";
import { SETTINGS_MASTER_FIRST_VIEWPORT_ID,
  SETTINGS_MASTER_PRIMARY_CONTENT_ID,
  SETTINGS_MASTER_SKIP_LINK_LABEL,
  SETTINGS_MASTER_SKIP_TARGET_ID,
} from "./settings-master-page-copy";
import {
  parseSettingsMasterSearchQuery,
  settingsMasterClearSearchHrefFromSearch,
  settingsMasterSearchHrefFromSearch,
} from "@/lib/administration/settings-master-search-url";
import {
  parseSettingsMasterAdvancedOpenFromSearch,
  settingsMasterAdvancedHrefFromSearch,
} from "@/lib/administration/settings-master-advanced-url";

export function SettingsPageView() {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlSearchQuery = parseSettingsMasterSearchQuery(searchParams.get("q"));
  const settingsMasterAdvancedOpenParam = searchParams.get("settingsMasterAdvancedOpen");
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const { productLine, assignmentOverrides } = useProductLine();
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [showAdvanced, setShowAdvancedState] = useState(() =>
    parseSettingsMasterAdvancedOpenFromSearch(settingsMasterAdvancedOpenParam),
  );
  const scope = useMemo(() => readOperatorScopeFromStorage(), []);
  const environmentLabel = isSelfHostedDeploymentEnv() ? "Self-hosted deployment" : "Managed SaaS";

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const syncShowAdvancedToUrl = useCallback(
    (open: boolean) => {
      router.replace(settingsMasterAdvancedHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setShowAdvanced = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      setShowAdvancedState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncShowAdvancedToUrl(next);

        return next;
      });
    },
    [syncShowAdvancedToUrl],
  );

  useEffect(() => {
    setShowAdvancedState(parseSettingsMasterAdvancedOpenFromSearch(settingsMasterAdvancedOpenParam));
  }, [settingsMasterAdvancedOpenParam]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = settingsMasterSearchHrefFromSearch(searchParams.toString(), searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [router, searchParams, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    router.replace(settingsMasterClearSearchHrefFromSearch(currentSearch), { scroll: false });
  }, [currentSearch, router]);

  const visibleSections = useMemo(
    () =>
      buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
        callerAuthorityRank,
        isAuthorityLoading,
        showInternalShell: isArchLucidInternalOperatorShellEnv(),
        searchQuery,
        showAdvanced,
        productLine,
        productLineAssignmentOverrides: assignmentOverrides,
      }),
    [assignmentOverrides, callerAuthorityRank, isAuthorityLoading, productLine, searchQuery, showAdvanced],
  );

  const hasAdvancedCatalog = SETTINGS_MASTER_SECTIONS.some((section) => section.tier === "advanced");
  const showAdvancedToggle = hasAdvancedCatalog && searchQuery.trim().length === 0;
  const canViewPrerequisitesBoard = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="settings-page">
      <a
        href={`#${SETTINGS_MASTER_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SETTINGS_MASTER_SKIP_LINK_LABEL}
      </a>

      <div
        id={SETTINGS_MASTER_PRIMARY_CONTENT_ID}
        data-testid="settings-master-primary-content"
        className={OPERATOR_LAYOUT.sectionStack}
      >
        <div
          id={SETTINGS_MASTER_FIRST_VIEWPORT_ID}
          data-testid={SETTINGS_MASTER_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <SettingsMasterOverviewHeader
            scope={scope}
            environmentLabel={environmentLabel}
            buyerPolishedShell={buyerPolishedShell}
          />

          <AdminPrerequisitesReadinessBoard enabled={canViewPrerequisitesBoard && !isAuthorityLoading} />
          <SettingsMasterSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            resultCount={visibleSections.length}
          />

          {showAdvancedToggle ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={showAdvanced}
                data-testid="settings-advanced-toggle"
                onClick={() => setShowAdvanced((current) => !current)}
              >
                {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
              </Button>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Identity and rarely changed controls stay collapsed until you need them.
              </p>
            </div>
          ) : null}

          {isAuthorityLoading ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading settings…</p>
          ) : visibleSections.length === 0 ? (
            <Card data-testid="settings-search-empty">
              <CardContent className={cn("py-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <p className="m-0">No settings match your search. Try a different term or clear the search field.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
              <SettingsMasterSectionNav sections={visibleSections} />

              <div className={OPERATOR_LAYOUT.sectionStack}>
                {visibleSections.map((section) => (
                  <section
                    key={section.id}
                    id={settingsMasterSectionDomId(section.id)}
                    className="scroll-mt-24 space-y-4"
                    aria-labelledby={`${settingsMasterSectionDomId(section.id)}-title`}
                    data-testid={`settings-section-${section.id}`}
                  >
                    <div>
                      <h2 id={`${settingsMasterSectionDomId(section.id)}-title`} className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                        {section.title}
                      </h2>
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                        {section.description}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {section.showSupportBundle ? (
                        <Card data-testid="settings-support-bundle-card">
                          <CardHeader>
                            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support bundle</CardTitle>
                          </CardHeader>
                          <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                            <p className="m-0">
                              Download a redacted diagnostics bundle to include with a support ticket.
                            </p>
                            <SupportBundleDownloadButton showDiagnosticsLink />
                            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                              The bundle is redacted before download. Review it before sending if your organization requires
                              approval.
                            </p>
                          </CardContent>
                        </Card>
                      ) : null}

                      {section.destinations.map((destination) => (
                        <SettingsMasterDestinationCard key={destination.id} destination={destination} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        <div data-testid="settings-master-orientation-bottom">
          <SettingsHubEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
