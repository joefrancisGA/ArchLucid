"use client";

import { PreferencesSaveChecklist } from "@/components/preferences/PreferencesSaveChecklist";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { TimeZonePreferencePanel } from "@/components/preferences/TimeZonePreferencePanel";
import { WhereToGoNextPreferencePanel } from "@/components/preferences/WhereToGoNextPreferencePanel";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { PREFERENCES_TIME_ZONE_HEADING } from "@/lib/iana-time-zone-preference-copy";
import {
  PREFERENCES_FOLLOW_UP_LINK_STRIPS_ANCHOR_ID,
  PREFERENCES_WHERE_TO_GO_NEXT_HEADING,
} from "@/lib/where-to-go-next-preference-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import {
  PREFERENCES_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID,
  PREFERENCES_SETTINGS_SKIP_LINK_LABEL,
  PREFERENCES_SETTINGS_SKIP_TARGET_ID,
  preferencesAppearanceThemeLead,
  preferencesSettingsPageSubtitle,
} from "@/lib/preferences-page-copy";
import {
  resolvePreferencesSaveEmphasizedStepId,
  resolvePreferencesSaveSteps,
} from "@/lib/preferences-save-checklist";
import { useUserAppearancePreference } from "@/lib/use-user-appearance-preference";
import { useIanaTimeZonePreference } from "@/lib/use-iana-time-zone-preference";
import { useUserPreferencesExplicitFlags } from "@/lib/use-user-preferences-explicit-flags";
import { useWhereToGoNextPreference } from "@/components/WhereToGoNextPreferenceProvider";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { productLine } = useProductLine();
  const { mounted: appearanceMounted, accountSyncState: appearanceAccountSyncState } = useUserAppearancePreference();
  const {
    enabled: whereToGoNextEnabled,
    mounted: whereToGoNextMounted,
    accountSyncState: whereToGoNextAccountSyncState,
    setAndPersist: setWhereToGoNextAndPersist,
  } = useWhereToGoNextPreference();
  const {
    ianaTimeZoneId,
    mounted: timeZoneMounted,
    accountSyncState: timeZoneAccountSyncState,
    setAndPersist: setTimeZoneAndPersist,
  } = useIanaTimeZonePreference();
  const explicitFlags = useUserPreferencesExplicitFlags();

  const preferencesSaveSteps = resolvePreferencesSaveSteps({
    appearance: {
      isExplicit: explicitFlags.appearanceIsExplicit,
      mounted: appearanceMounted,
      accountSyncState: appearanceAccountSyncState,
    },
    timeZone: {
      isExplicit: explicitFlags.ianaTimeZoneIsExplicit,
      mounted: timeZoneMounted,
      accountSyncState: timeZoneAccountSyncState,
    },
    followUpLinkStrips: {
      isExplicit: explicitFlags.whereToGoNextIsExplicit,
      mounted: whereToGoNextMounted,
      accountSyncState: whereToGoNextAccountSyncState,
    },
  });
  const preferencesSaveEmphasizedStepId = resolvePreferencesSaveEmphasizedStepId(preferencesSaveSteps);

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="preferences-settings-page">
      <a
        href={`#${PREFERENCES_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {PREFERENCES_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={ACCOUNT_PREFERENCES_PATH}
          title="Preferences"
          subtitle={preferencesSettingsPageSubtitle(buyerPolishedShell)}
          titleTestId="preferences-settings-page-title"
          actions={
            buyerPolishedShell ? null : <PageContextualHelpButton triggerText={PREFERENCES_HELP_TOPIC_LABEL} />
          }
        />

        <div
          id={PREFERENCES_SETTINGS_SKIP_TARGET_ID}
          data-testid={PREFERENCES_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <PreferencesSaveChecklist
            title="Save preferences checklist"
            steps={preferencesSaveSteps}
            emphasizedStepId={preferencesSaveEmphasizedStepId}
            testIdPrefix="preferences-save"
          />
          <Card id="appearance" data-testid="preferences-appearance-card">
            <CardHeader>
              <CardTitle as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p id="preferences-theme-label" className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Theme
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {preferencesAppearanceThemeLead(productLine)}
                </p>
              </div>
              <ThemePreferenceSelector fieldsetLabelledById="preferences-theme-label" />
            </CardContent>
          </Card>
          <Card id="time-zone" data-testid="preferences-time-zone-card">
            <CardHeader>
              <CardTitle id="preferences-time-zone-heading" as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                {PREFERENCES_TIME_ZONE_HEADING}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeZoneMounted ? (
                <TimeZonePreferencePanel
                  ianaTimeZoneId={ianaTimeZoneId}
                  onIanaTimeZoneIdChange={setTimeZoneAndPersist}
                  accountSyncState={timeZoneAccountSyncState}
                  labelledById="preferences-time-zone-heading"
                />
              ) : (
                <div aria-hidden="true" className="h-20 w-full" data-testid="time-zone-preference-loading" />
              )}
            </CardContent>
          </Card>
          <Card id={PREFERENCES_FOLLOW_UP_LINK_STRIPS_ANCHOR_ID} data-testid="preferences-follow-up-link-strips-card">
            <CardHeader>
              <CardTitle id="preferences-follow-up-strips-heading" as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                {PREFERENCES_WHERE_TO_GO_NEXT_HEADING}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whereToGoNextMounted ? (
                <WhereToGoNextPreferencePanel
                  enabled={whereToGoNextEnabled}
                  onEnabledChange={setWhereToGoNextAndPersist}
                  accountSyncState={whereToGoNextAccountSyncState}
                  labelledById="preferences-follow-up-strips-heading"
                />
              ) : (
                <div aria-hidden="true" className="h-16 w-full" data-testid="where-to-go-next-preference-loading" />
              )}
            </CardContent>
          </Card>
        </div>

        <div data-testid="preferences-settings-orientation-bottom">
          <PreferencesSettingsEvidenceOrientationStrip
            productLineId={productLine}
            readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
          />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
