"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ExtractUploadCloudConnectionsVocabularyRail } from "@/components/ExtractUploadCloudConnectionsVocabularyRail";
import { ExtractUploadConstraintsPanel } from "@/components/usability/ExtractUploadConstraintsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { AzureExtractorQuickStartCommandPanel } from "@/components/wizard/AzureExtractorQuickStartCommandPanel";
import { EXTRACTOR_SCRIPT_CDN_URL } from "@/hooks/use-extract-upload-baseline-query";
import { buildAdvancedGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_PAGE_CONTAINER,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY,
  EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION,
  EXTRACT_UPLOAD_DEMO_ASIDE_TITLE,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL,
  EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL,
  EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_COLLECT_TITLE,
  EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY,
  EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND,
} from "@/lib/extract-upload-settings-page-copy";
import { ExtractUploadSettingsPageHeader } from "./ExtractUploadSettingsPageHeader";
import { ExtractUploadSettingsBuyerChrome } from "./ExtractUploadSettingsBuyerChrome";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID,
  EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL,
} from "@/lib/extract-upload-settings-page-copy";
import { ExtractUploadZipDropShell } from "./ExtractUploadZipDropShell";
import { useExtractUploadSettings } from "./use-extract-upload-settings";

/**
 * Guided Extract & Upload settings page — PowerShell script, validate hint, and server ZIP upload.
 */
export function ExtractUploadSettingsPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const model = useExtractUploadSettings();
  const {
    baselineLoading,
    hasBaselineArtifacts,
    extractorScriptVersion,
    extractorUpdateBanner,
    extractUploadSteps,
    extractUploadEmphasizedStepId,
    selectedDemoScenarioId,
    setSelectedDemoScenarioId,
    busy,
    onTryDemoData,
    ...zipDropProps
  } = model;

  return (
    <div
      className={cn(OPERATOR_PAGE_CONTAINER.base, OPERATOR_PAGE_CONTAINER.variant.workflow, OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="extract-upload-settings-page"
    >
      <a
        href={`#${EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid="extract-upload-settings-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.majorSectionGap)}
      >
        <ExtractUploadSettingsPageHeader
          baselineLoading={baselineLoading}
          hasBaselineArtifacts={hasBaselineArtifacts}
          extractorScriptVersion={extractorScriptVersion}
        />

        <ExtractUploadSettingsBuyerChrome />

        {!buyerPolishedShell ? <ExtractUploadSettingsEvidenceOrientationStrip /> : null}

        {buyerPolishedShell ? null : (
          <ExtractUploadCloudConnectionsVocabularyRail currentSurfaceId="extract-upload" />
        )}

        <IntegrationConnectChecklist
          title="Upload checklist"
          steps={extractUploadSteps}
          emphasizedStepId={extractUploadEmphasizedStepId}
          testIdPrefix="extract-upload-package"
        />

      {extractorUpdateBanner ? (
        <div
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="extractor-version-banner"
        >
          {extractorUpdateBanner}
        </div>
      ) : null}

      <div
        className={cn(OPERATOR_LAYOUT.mainWithStickyAside)}
        data-testid="extract-upload-page-layout"
      >
        <div className={cn("min-w-0", OPERATOR_LAYOUT.sectionStack)} data-testid="extract-upload-page-main">
          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{EXTRACT_UPLOAD_STEP_COLLECT_TITLE}</CardTitle>
              <CardDescription>{EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AzureExtractorQuickStartCommandPanel testIdPrefix="extract-upload-quick-start" />
              <details
                className={cn("rounded-md border border-neutral-200 p-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
              >
                <summary
                  className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}
                >
                  {EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY}
                </summary>
                <pre
                  className={cn(
                    "mt-3 overflow-auto whitespace-pre-wrap break-words rounded-md bg-neutral-950 p-3 text-neutral-100",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
                  <code className="whitespace-pre-wrap break-words">
                    {buildAdvancedGetArchLucidAzurePackageCommandLine()}
                  </code>
                </pre>
              </details>
              <a
                href={EXTRACTOR_SCRIPT_CDN_URL}
                className={cn("inline-block", OPERATOR_LINK.nav)}
                target="_blank"
                rel="noreferrer"
              >
                {EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL}
              </a>
            </CardContent>
          </Card>

          <ExtractUploadZipDropShell {...zipDropProps} />
        </div>

        <aside
          className={cn(OPERATOR_LAYOUT.stickyAsideTop, OPERATOR_LAYOUT.sectionStack)}
          data-testid="extract-upload-page-aside"
        >
          <ExtractUploadConstraintsPanel />

          <details
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="extract-upload-validate-disclosure"
          >
            <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              {EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY}
            </summary>
            <div className={cn("m-0 mt-3 space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {[
                { label: "Azure", command: EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND },
                { label: "AWS", command: EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND },
                { label: "Google Cloud", command: EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND },
              ].map((entry) => (
                <p key={entry.label} className="m-0">
                  <span className="font-medium">{entry.label}:</span>{" "}
                  <code
                    className={cn(
                      "inline-block whitespace-pre-wrap break-words rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800",
                      OPERATOR_TYPOGRAPHY.micro,
                    )}
                  >
                    {entry.command}
                  </code>
                </p>
              ))}
            </div>
          </details>

          <section
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="extract-upload-demo-aside"
          >
            <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {EXTRACT_UPLOAD_DEMO_ASIDE_TITLE}
            </h3>
            <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION}
            </p>
            <div className="mt-3 space-y-3">
              <AzureExtractorDemoScenarioPicker
                selectedScenarioId={selectedDemoScenarioId}
                onSelectScenario={setSelectedDemoScenarioId}
                testIdPrefix="extract-upload-demo"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                data-testid="extract-upload-try-demo-data"
                onClick={() => {
                  void onTryDemoData();
                }}
              >
                Try with Demo Data
              </Button>
            </div>
          </section>

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            <Link
              href={EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF}
              className={OPERATOR_LINK.inline}
              data-testid="extract-upload-evidence-trail-link"
            >
              {EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL}
            </Link>
          </p>
        </aside>
      </div>
      </div>
    </div>
  );
}
