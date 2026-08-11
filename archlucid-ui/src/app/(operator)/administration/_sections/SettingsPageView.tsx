"use client";

import { useMemo, useState } from "react";

import { AdminPrerequisitesReadinessBoard } from "@/components/administration/AdminPrerequisitesReadinessBoard";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { readOperatorScopeFromStorage } from "@/lib/operator-scope-storage";
import { cn } from "@/lib/utils";

import { SETTINGS_MASTER_SECTIONS, settingsMasterSectionDomId } from "./settings-master-catalog";
import { buildSettingsMasterVisibleSections } from "./settings-master-page-model";
import { SettingsMasterDestinationCard } from "./SettingsMasterDestinationCard";
import { SettingsMasterOverviewHeader } from "./SettingsMasterOverviewHeader";
import { SettingsMasterSearchField } from "./SettingsMasterSearchField";
import { SettingsMasterSectionNav } from "./SettingsMasterSectionNav";

export function SettingsPageView() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const scope = useMemo(() => readOperatorScopeFromStorage(), []);
  const environmentLabel = isSelfHostedDeploymentEnv() ? "Self-hosted deployment" : "Managed SaaS";

  const visibleSections = useMemo(
    () =>
      buildSettingsMasterVisibleSections(SETTINGS_MASTER_SECTIONS, {
        callerAuthorityRank,
        isAuthorityLoading,
        showInternalShell: isArchLucidInternalOperatorShellEnv(),
        searchQuery,
        showAdvanced,
      }),
    [callerAuthorityRank, isAuthorityLoading, searchQuery, showAdvanced],
  );

  const hasAdvancedCatalog = SETTINGS_MASTER_SECTIONS.some((section) => section.tier === "advanced");
  const showAdvancedToggle = hasAdvancedCatalog && searchQuery.trim().length === 0;
  const canViewPrerequisitesBoard = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  return (
    <div className="w-full max-w-6xl space-y-6" data-testid="settings-page">
      <SettingsMasterOverviewHeader scope={scope} environmentLabel={environmentLabel} />
      <AdminPrerequisitesReadinessBoard enabled={canViewPrerequisitesBoard && !isAuthorityLoading} />
      <SettingsMasterSearchField
        value={searchQuery}
        onChange={setSearchQuery}
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

          <div className="space-y-8">
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
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
  );
}
