"use client";

import { PreferencesSaveChecklist } from "@/components/preferences/PreferencesSaveChecklist";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { CloudPlatformScopePanel } from "@/components/preferences/CloudPlatformScopePanel";
import { SampleReviewsOnOverviewPreferencePanel } from "@/components/preferences/SampleReviewsOnOverviewPreferencePanel";
import { TimeZonePreferencePanel } from "@/components/preferences/TimeZonePreferencePanel";
import { WhereToGoNextPreferencePanel } from "@/components/preferences/WhereToGoNextPreferencePanel";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PreferencesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { PREFERENCES_CLOUD_PLATFORMS_HEADING } from "@/lib/cloud-platform-scope-copy";
import { PREFERENCES_TIME_ZONE_HEADING } from "@/lib/iana-time-zone-preference-copy";
import {
  PREFERENCES_FOLLOW_UP_LINK_STRIPS_ANCHOR_ID,
  PREFERENCES_WHERE_TO_GO_NEXT_HEADING,
} from "@/lib/where-to-go-next-preference-copy";
import {
  PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_ANCHOR_ID,
  PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_HEADING,
} from "@/lib/sample-reviews-on-overview-preference-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import {
  resolvePreferencesSaveEmphasizedStepId,
  resolvePreferencesSaveSteps,
} from "@/lib/preferences-save-checklist";
import { useUserAppearancePreference } from "@/lib/use-user-appearance-preference";
import { useCloudPlatformScope } from "@/lib/use-cloud-platform-scope";
import { useIanaTimeZonePreference } from "@/lib/use-iana-time-zone-preference";
import { useUserPreferencesExplicitFlags } from "@/lib/use-user-preferences-explicit-flags";
import { useSampleReviewsOnOverviewPreference } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { useWhereToGoNextPreference } from "@/components/WhereToGoNextPreferenceProvider";
import { cn } from "@/lib/utils";

export function PreferencesSettingsPageView() {
  const { mounted: appearanceMounted, accountSyncState: appearanceAccountSyncState } = useUserAppearancePreference();
  const { scope, mounted, accountSyncState, setAndPersist } = useCloudPlatformScope();
  const {
    enabled: whereToGoNextEnabled,
    mounted: whereToGoNextMounted,
    accountSyncState: whereToGoNextAccountSyncState,
    setAndPersist: setWhereToGoNextAndPersist,
  } = useWhereToGoNextPreference();
  const {
    enabled: sampleReviewsOnOverviewEnabled,
    mounted: sampleReviewsOnOverviewMounted,
    accountSyncState: sampleReviewsOnOverviewAccountSyncState,
    setAndPersist: setSampleReviewsOnOverviewAndPersist,
  } = useSampleReviewsOnOverviewPreference();
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
    cloudPlatforms: {
      isExplicit: explicitFlags.cloudPlatformScopeIsExplicit,
      mounted,
      accountSyncState,
    },
    sampleReviewsOnOverview: {
      isExplicit: explicitFlags.sampleReviewsOnOverviewIsExplicit,
      mounted: sampleReviewsOnOverviewMounted,
      accountSyncState: sampleReviewsOnOverviewAccountSyncState,
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
      <OperatorPageHeader
        navHref={ACCOUNT_PREFERENCES_PATH}
        title="Preferences"
        titleTestId="preferences-settings-page-title"
        actions={<PageContextualHelpButton triggerText={PREFERENCES_HELP_TOPIC_LABEL} />}
      />
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
              Choose how ArchLucid appears.
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
      <Card id="cloud-platforms-shown" data-testid="preferences-cloud-platforms-card">
        <CardHeader>
          <CardTitle id="preferences-cloud-platforms-heading" as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {PREFERENCES_CLOUD_PLATFORMS_HEADING}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mounted ? (
            <CloudPlatformScopePanel
              scope={scope}
              onScopeChange={setAndPersist}
              accountSyncState={accountSyncState}
              labelledById="preferences-cloud-platforms-heading"
            />
          ) : (
            <div aria-hidden="true" className="h-24 w-full" data-testid="cloud-platform-scope-loading" />
          )}
        </CardContent>
      </Card>
      <Card
        id={PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_ANCHOR_ID}
        data-testid="preferences-sample-reviews-on-overview-card"
      >
        <CardHeader>
          <CardTitle
            id="preferences-sample-reviews-on-overview-heading"
            as="h2"
            className={OPERATOR_TYPOGRAPHY.cardTitle}
          >
            {PREFERENCES_SAMPLE_REVIEWS_ON_OVERVIEW_HEADING}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sampleReviewsOnOverviewMounted ? (
            <SampleReviewsOnOverviewPreferencePanel
              enabled={sampleReviewsOnOverviewEnabled}
              onEnabledChange={setSampleReviewsOnOverviewAndPersist}
              accountSyncState={sampleReviewsOnOverviewAccountSyncState}
              labelledById="preferences-sample-reviews-on-overview-heading"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-16 w-full"
              data-testid="sample-reviews-on-overview-preference-loading"
            />
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
      <PreferencesSettingsEvidenceOrientationStrip />
    </OperatorPageContainer>
  );
}
