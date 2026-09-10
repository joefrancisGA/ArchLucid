"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { ExtractUploadCloudConnectionsVocabularyRail } from "@/components/ExtractUploadCloudConnectionsVocabularyRail";
import { ExtractUploadConstraintsPanel } from "@/components/usability/ExtractUploadConstraintsPanel";
import { ExtractUploadFileProgressList } from "@/components/usability/ExtractUploadFileProgressList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { CloudInventoryExtractorCommandPanel } from "@/components/wizard/CloudInventoryExtractorCommandPanel";
import { buildGetArchLucidCloudPackageCommandLine } from "@/lib/get-archlucid-cloud-package-command";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_PAGE_CONTAINER,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  COMMAND_PALETTE_EXTRACT_UPLOAD_COPY_QUICK_START_EVENT,
  COMMAND_PALETTE_EXTRACT_UPLOAD_FOCUS_EVENT,
} from "@/lib/command-palette-handler-actions";
import {
  EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY,
  EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION,
  EXTRACT_UPLOAD_DEMO_ASIDE_TITLE,
  EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL,
  EXTRACT_UPLOAD_EXECUTION_POLICY_SCOPE_PROCESS_COMMAND,
  EXTRACT_UPLOAD_REVIEW_BINDING_NONE,
  EXTRACT_UPLOAD_REVIEW_BINDING_PREFIX,
  EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL,
  EXTRACT_UPLOAD_SCRIPT_HASH_PREFIX,
  EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_COLLECT_TITLE,
  EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_UPLOAD_TITLE,
  EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE,
  EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE,
  EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY,
  EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND,
} from "@/lib/extract-upload-settings-page-copy";
import { truncateExtractUploadPackageId } from "@/lib/extract-upload-accepted-package-record";
import { truncateExtractorScriptSha256Digest } from "@/lib/extract-upload-script-hash";
import { ExtractUploadSettingsPageHeader } from "./ExtractUploadSettingsPageHeader";
import { ExtractUploadSettingsBuyerChrome } from "./ExtractUploadSettingsBuyerChrome";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID,
  EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL,
  EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/extract-upload-settings-page-copy";
import { useExtractUploadPageClient } from "./use-extract-upload-page-client";
import { useExtractUploadShortcuts } from "./use-extract-upload-shortcuts";
import { ExtractUploadAcceptedPackagePanel } from "./ExtractUploadAcceptedPackagePanel";
import { ExtractUploadBaselineOverwriteConfirmDialog } from "./ExtractUploadBaselineOverwriteConfirmDialog";
import { ExtractUploadProviderSelector } from "./ExtractUploadProviderSelector";

function validateCommandForPlatform(platform: CloudInventoryPlatform): string {
  switch (platform) {
    case "azure":
      return EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND;
    case "aws":
      return EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND;
    case "gcp":
      return EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND;
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

function reviewBindingStepLabel(associateRunId: string | null): string {
  const trimmed = associateRunId?.trim() ?? "";

  if (trimmed.length === 0) {
    return EXTRACT_UPLOAD_REVIEW_BINDING_NONE;
  }

  return `${EXTRACT_UPLOAD_REVIEW_BINDING_PREFIX} ${truncateExtractUploadPackageId(trimmed, 12)}`;
}

/**
 * Guided Extract & Upload settings page — PowerShell script, validate hint, and server ZIP upload.
 */
export function ExtractUploadSettingsPageClient() {
  return <ExtractUploadSettingsPageClientInner />;
}

function ExtractUploadSettingsPageClientInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/extract-upload";
  const viewModel = useExtractUploadPageClient({
    router,
    pathname,
    searchParams,
  });

  useExtractUploadShortcuts();

  const {
    productLine,
    extractorScriptDownloadUrl,
    validateDisclosureOpen,
    setValidateDisclosureOpen,
    advancedCommandOpen,
    setAdvancedCommandOpen,
    buyerPolishedShell,
    baselineLoading,
    hasInventoryOnFile,
    extractorScriptVersion,
    extractorUpdateBanner,
    extractorScriptSha256,
    lastAcceptedPackage,
    associateRunId,
    selectedPlatform,
    setSelectedPlatform,
    extractUploadSteps,
    extractUploadEmphasizedStepId,
    upload,
    folderZip,
    demo,
    baselineOverwriteOpen,
    setBaselineOverwriteOpen,
    confirmBaselineOverwrite,
    cancelBaselineOverwrite,
    showAcceptedDropZone,
    beginReplaceInventory,
  } = viewModel;

  useEffect(() => {
    function onFocusUpload() {
      const replace = document.querySelector<HTMLElement>('[data-testid="extract-upload-accepted-replace"]');

      if (replace !== null) {
        replace.click();

        return;
      }

      document.querySelector<HTMLElement>('[data-testid="extract-upload-drop-zone-surface"]')?.focus();
    }

    function onCopyQuickStart() {
      document.querySelector<HTMLButtonElement>('[data-testid="extract-upload-quick-start-copy"]')?.click();
    }

    window.addEventListener(COMMAND_PALETTE_EXTRACT_UPLOAD_FOCUS_EVENT, onFocusUpload);
    window.addEventListener(COMMAND_PALETTE_EXTRACT_UPLOAD_COPY_QUICK_START_EVENT, onCopyQuickStart);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_EXTRACT_UPLOAD_FOCUS_EVENT, onFocusUpload);
      window.removeEventListener(COMMAND_PALETTE_EXTRACT_UPLOAD_COPY_QUICK_START_EVENT, onCopyQuickStart);
    };
  }, []);

  const validateCommand = validateCommandForPlatform(selectedPlatform);
  const platformLabel = cloudInventoryPlatformLabel(selectedPlatform);
  const showScriptDownload = selectedPlatform === "azure";

  return (
    <div
      className={cn(OPERATOR_PAGE_CONTAINER.base, OPERATOR_PAGE_CONTAINER.variant.workflow, OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="extract-upload-settings-page"
    >
      <a
        href={`#${EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid="extract-upload-settings-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <ExtractUploadSettingsPageHeader
          baselineLoading={baselineLoading}
          hasInventoryOnFile={hasInventoryOnFile}
          extractorScriptVersion={extractorScriptVersion}
          associateRunId={associateRunId}
        />

        {buyerPolishedShell ? null : (
          <ExtractUploadCloudConnectionsVocabularyRail
            currentSurfaceId="extract-upload"
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
          />
        )}

        <div
          id={EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID}
          data-testid={EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.majorSectionGap,
          )}
        >
          <ExtractUploadSettingsBuyerChrome />

          {!buyerPolishedShell ? <ExtractUploadSettingsEvidenceOrientationStrip /> : null}

          {lastAcceptedPackage !== null ? (
            <ExtractUploadAcceptedPackagePanel
              record={lastAcceptedPackage}
              onReplaceInventory={beginReplaceInventory}
            />
          ) : null}

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
                  <ExtractUploadProviderSelector
                    value={selectedPlatform}
                    onValueChange={setSelectedPlatform}
                  />
                  <CloudInventoryExtractorCommandPanel
                    platform={selectedPlatform}
                    testIdPrefix="extract-upload-quick-start"
                  />
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    <span className="font-medium text-al-text-primary">Process scope:</span>{" "}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
                      {EXTRACT_UPLOAD_EXECUTION_POLICY_SCOPE_PROCESS_COMMAND}
                    </code>
                  </p>
                  <details
                    className={cn("rounded-md border border-neutral-200 p-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}
                    open={advancedCommandOpen}
                    onToggle={(event) => {
                      setAdvancedCommandOpen((event.currentTarget as HTMLDetailsElement).open);
                    }}
                  >
                    <summary
                      className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}
                    >
                      {EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY.replace("Azure", platformLabel)}
                    </summary>
                    <pre
                      className={cn(
                        "mt-3 overflow-auto whitespace-pre-wrap break-words rounded-md border border-neutral-200 bg-white p-3 leading-relaxed dark:border-neutral-700 dark:bg-neutral-900",
                        OPERATOR_TYPOGRAPHY.micro,
                      )}
                      data-testid="extract-upload-advanced-command"
                    >
                      <code className="whitespace-pre-wrap break-words">
                        {buildGetArchLucidCloudPackageCommandLine({
                          platform: selectedPlatform,
                          productLineId: productLine,
                          quickStart: false,
                        })}
                      </code>
                    </pre>
                  </details>
                  {showScriptDownload ? (
                    <div className="space-y-1">
                      <a
                        href={extractorScriptDownloadUrl}
                        className={cn("inline-block", OPERATOR_LINK.nav)}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="extract-upload-script-download"
                      >
                        {EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL}
                      </a>
                      {extractorScriptSha256 !== null ? (
                        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="extract-upload-script-hash">
                          {EXTRACT_UPLOAD_SCRIPT_HASH_PREFIX}:{" "}
                          <span className="font-mono">{truncateExtractorScriptSha256Digest(extractorScriptSha256)}</span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Download {platformLabel} packager scripts from your ArchLucid checkout under <code>scripts/</code>.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{EXTRACT_UPLOAD_STEP_UPLOAD_TITLE}</CardTitle>
                  <CardDescription>
                    {EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION}
                  </CardDescription>
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="extract-upload-step-review-binding"
                  >
                    {reviewBindingStepLabel(associateRunId)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upload.uploadSuccessMessage !== null ? (
                    <div
                      role="status"
                      className={cn("rounded-md border border-emerald-700/30 bg-emerald-50/50 px-3 py-2 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.body)}
                      data-testid="extract-upload-success-live"
                    >
                      {EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE}
                    </div>
                  ) : null}
                  {upload.uploadError !== null ? (
                    <div role="alert" data-testid="extract-upload-error-live">
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE}
                      </p>
                      <AzureExtractorUploadFailureCallout
                        fallbackMessage={upload.uploadError.message}
                        problem={upload.uploadError.problem}
                        correlationId={upload.uploadError.correlationId}
                      />
                    </div>
                  ) : null}
                  {showAcceptedDropZone ? (
                    <div
                      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                      data-testid="extract-upload-accepted-drop-summary"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <StatusTag kind="ready" label="Package accepted" />
                          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                            <span className="font-mono">{upload.packageId}</span>
                            {folderZip.selectedFileLabel !== null ? (
                              <span className="text-al-text-secondary"> — {folderZip.selectedFileLabel}</span>
                            ) : null}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="extract-upload-accepted-replace"
                          onClick={beginReplaceInventory}
                        >
                          Replace inventory
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <AzureExtractorZipDropZone
                        ariaLabel={EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL}
                        busy={upload.busy}
                        testId="extract-upload-drop-zone"
                        hint={
                          folderZip.selectedFileLabel !== null ? (
                            <p
                              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
                              data-testid="extract-upload-file-meta"
                            >
                              Selected: {folderZip.selectedFileLabel}
                            </p>
                          ) : null
                        }
                        onZipSelected={folderZip.onZipSelected}
                        onFolderSelected={folderZip.onFolderSelected}
                      />
                      <ExtractUploadFileProgressList fileStatuses={folderZip.fileStatuses} />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside
              className={cn(OPERATOR_LAYOUT.stickyAsideTop, OPERATOR_LAYOUT.sectionStack)}
              data-testid="extract-upload-page-aside"
            >
              <ExtractUploadConstraintsPanel platform={selectedPlatform} />

              <details
                className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                data-testid="extract-upload-validate-disclosure"
                open={validateDisclosureOpen}
                onToggle={(event) => {
                  setValidateDisclosureOpen((event.currentTarget as HTMLDetailsElement).open);
                }}
              >
                <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                  {EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY}
                </summary>
                <div className={cn("m-0 mt-3 space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  <p className="m-0">
                    <span className="font-medium">{platformLabel}:</span>{" "}
                    <code
                      className={cn(
                        "inline-block whitespace-pre-wrap break-words rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800",
                        OPERATOR_TYPOGRAPHY.micro,
                      )}
                    >
                      {validateCommand}
                    </code>
                  </p>
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
                    layout="stack"
                    selectedScenarioId={demo.selectedDemoScenarioId}
                    onSelectScenario={demo.setSelectedDemoScenarioId}
                    testIdPrefix="extract-upload-demo"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={upload.busy}
                    data-testid="extract-upload-try-demo-data"
                    onClick={() => {
                      void demo.onTryDemoData();
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

      <ExtractUploadBaselineOverwriteConfirmDialog
        open={baselineOverwriteOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelBaselineOverwrite();
          } else {
            setBaselineOverwriteOpen(true);
          }
        }}
        onConfirm={confirmBaselineOverwrite}
      />
    </div>
  );
}
