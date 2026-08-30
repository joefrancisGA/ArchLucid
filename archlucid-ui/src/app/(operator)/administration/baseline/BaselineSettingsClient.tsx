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
  BASELINE_SETTINGS_PAGE_SUBTITLE,
  BASELINE_SETTINGS_PAGE_TITLE,
} from "@/lib/baseline-settings-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Client UI for ROI baseline measurement fields (loads/saves `/v1/tenant/baseline` via proxy). */
export function BaselineSettingsClient() {
  const settings = useBaselineSettings();
  const {
    demoMode,
    loadFailure,
    loading,
    loadedSnapshot,
  } = settings;

  return (
    <OperatorPageContainer variant="settings" className="space-y-4">
      <OperatorPageHeader
        title={BASELINE_SETTINGS_PAGE_TITLE}
        subtitle={BASELINE_SETTINGS_PAGE_SUBTITLE}
        titleTestId="baseline-settings-page-title"
        actions={<PageContextualHelpButton />}
      />
      <BaselineSettingsEvidenceOrientationStrip />
      <BaselineRoiVocabularyRail currentSurfaceId="baseline" />
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
    </OperatorPageContainer>
  );
}
