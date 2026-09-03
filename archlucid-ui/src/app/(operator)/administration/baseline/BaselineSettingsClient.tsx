"use client";

import { cn } from "@/lib/utils";

import { BaselineSettingsFormFields } from "@/app/(operator)/administration/baseline/BaselineSettingsFormFields";
import { useBaselineSettings } from "@/app/(operator)/administration/baseline/use-baseline-settings";
import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { BaselineSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  BASELINE_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BASELINE_SETTINGS_PRIMARY_CONTENT_ID,
  BASELINE_SETTINGS_SKIP_LINK_LABEL,
  BASELINE_SETTINGS_SKIP_TARGET_ID,
  baselineSettingsPageSubtitle,
} from "@/lib/baseline-settings-page-copy";
import { BASELINE_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/baseline-settings-evidence-copy";
import {
  BASELINE_SETTINGS_PAGE_SUBTITLE,
  BASELINE_SETTINGS_PAGE_TITLE,
} from "@/lib/baseline-settings-present";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Client UI for ROI baseline measurement fields (loads/saves `/v1/tenant/baseline` via proxy). */
export function BaselineSettingsClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const settings = useBaselineSettings();
  const {
    demoMode,
    loadFailure,
    loading,
    loadedSnapshot,
  } = settings;

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack}>
      <a
        href={`#${BASELINE_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {BASELINE_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={BASELINE_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={BASELINE_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          title={BASELINE_SETTINGS_PAGE_TITLE}
          subtitle={baselineSettingsPageSubtitle(buyerPolishedShell, BASELINE_SETTINGS_PAGE_SUBTITLE)}
          titleTestId="baseline-settings-page-title"
          claimDiscipline={BASELINE_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={BASELINE_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={buyerPolishedShell ? null : <PageContextualHelpButton />}
        />

        <div
          id={BASELINE_SETTINGS_SKIP_TARGET_ID}
          data-testid={BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {!buyerPolishedShell ? <BaselineRoiVocabularyRail currentSurfaceId="baseline" /> : null}
          {demoMode ? (
            <DemoUnavailableNotice
              title="Baseline settings"
              description="ROI baseline measurement requires a connected deployment and tenant API access."
            />
          ) : null}

          {!demoMode && loadFailure !== null ? (
            <div role="alert">
              <OperatorApiProblem
                problem={loadFailure.problem}
                fallbackMessage={loadFailure.message}
                correlationId={loadFailure.correlationId}
              />
            </div>
          ) : null}

          {!demoMode && !loading && loadedSnapshot !== null ? (
            <BaselineSettingsFormFields {...settings} />
          ) : null}

          {!demoMode && loading ? (
            <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
          ) : null}
        </div>

        <div data-testid="baseline-settings-orientation-bottom">
          <BaselineSettingsEvidenceOrientationStrip />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
