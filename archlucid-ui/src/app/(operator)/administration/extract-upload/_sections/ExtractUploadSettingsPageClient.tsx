"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { ExtractUploadCloudConnectionsVocabularyRail } from "@/components/ExtractUploadCloudConnectionsVocabularyRail";
import { ExtractUploadConstraintsPanel } from "@/components/usability/ExtractUploadConstraintsPanel";
import { ExtractUploadFileProgressList } from "@/components/usability/ExtractUploadFileProgressList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { AzureExtractorQuickStartCommandPanel } from "@/components/wizard/AzureExtractorQuickStartCommandPanel";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { buildAdvancedGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { buildArchLucidAzurePackageZipFromFileList, type FolderPackageFileStatus } from "@/lib/read-arch-lucid-azure-folder-package";
import { readArchLucidAzurePackageZipFromBytes, readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";
import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { ApiV1Routes } from "@/lib/api-v1-routes";
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
  EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_UPLOAD_TITLE,
  EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY,
} from "@/lib/extract-upload-settings-page-copy";
import { ExtractUploadSettingsPageHeader } from "./ExtractUploadSettingsPageHeader";
import { ExtractUploadSettingsBuyerChrome } from "./ExtractUploadSettingsBuyerChrome";
import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID,
  EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL,
} from "@/lib/extract-upload-settings-page-copy";

const EXTRACTOR_SCRIPT_CDN_URL =
  process.env.NEXT_PUBLIC_EXTRACTOR_SCRIPT_CDN_URL?.trim() ||
  "https://cdn.archlucid.net/scripts/Get-ArchLucidAzurePackage.ps1";

const EXTRACTOR_SCRIPT_VERSION_PATTERN = /\$scriptVersion\s*=\s*"([^"]+)"/;

type WorkspaceBaselineArtifactsPayload = {
  hasBaselineArtifacts?: unknown;
  extractorScriptVersion?: string | null;
};

/**
 * Guided Extract & Upload settings page — PowerShell script, validate hint, and server ZIP upload.
 */
export function ExtractUploadSettingsPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [busy, setBusy] = useState(false);
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<FolderPackageFileStatus[]>([]);
  const [extractorUpdateBanner, setExtractorUpdateBanner] = useState<string | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [hasBaselineArtifacts, setHasBaselineArtifacts] = useState<boolean | null>(null);
  const [extractorScriptVersion, setExtractorScriptVersion] = useState<string | null>(null);
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setBaselineLoading(true);

      try {
        const [baselineResponse, scriptResponse] = await Promise.all([
          fetch(
            `/api/proxy/${ApiV1Routes.tenantWorkspaceBaselineArtifacts}`,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
          ),
          fetch(EXTRACTOR_SCRIPT_CDN_URL, { cache: "no-store" }),
        ]);

        if (canceled) {
          return;
        }

        let baseline: WorkspaceBaselineArtifactsPayload | null = null;

        if (baselineResponse.ok) {
          baseline = tryParseJsonResponseText<WorkspaceBaselineArtifactsPayload>(await baselineResponse.text());
          setHasBaselineArtifacts(baseline?.hasBaselineArtifacts === true);
          setExtractorScriptVersion(baseline?.extractorScriptVersion?.trim() || null);
        } else {
          setHasBaselineArtifacts(null);
          setExtractorScriptVersion(null);
        }

        if (!scriptResponse.ok || baseline === null) {
          return;
        }

        const scriptText = await scriptResponse.text();
        const match = EXTRACTOR_SCRIPT_VERSION_PATTERN.exec(scriptText);
        const latestVersion = match?.[1]?.trim();

        if (!latestVersion || !baseline.extractorScriptVersion) {
          return;
        }

        if (baseline.extractorScriptVersion !== latestVersion) {
          setExtractorUpdateBanner(
            `Your last uploaded ZIP used extractor script v${baseline.extractorScriptVersion}. v${latestVersion} is available — download the updated script for improved coverage.`,
          );
        }
      } catch {
        if (!canceled) {
          setHasBaselineArtifacts(null);
          setExtractorScriptVersion(null);
        }
      } finally {
        if (!canceled) {
          setBaselineLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  async function onFolderSelected(files: FileList): Promise<void> {
    setUploadError(null);
    setPackageId(null);
    setFileStatuses([]);

    const built = await buildArchLucidAzurePackageZipFromFileList(files);
    setFileStatuses(built.fileStatuses);

    if (!built.ok) {
      setUploadError({
        message: built.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    setSelectedFileLabel(`${built.zipFile.name} (folder packaged)`);
    await onUpload(built.zipFile);
  }

  async function onZipSelected(file: File): Promise<void> {
    setUploadError(null);
    setPackageId(null);
    setSelectedFileLabel(`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);

    const validation = await readArchLucidAzurePackageZipFromFile(file);

    if (!validation.ok) {
      setUploadError({
        message: validation.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    await onUpload(file);
  }

  async function onTryDemoData(): Promise<void> {
    setUploadError(null);
    setPackageId(null);
    setFileStatuses([]);

    const scenario = getAzureExtractorDemoScenario(selectedDemoScenarioId);
    const bytes = getAzureExtractorDemoZipBytes(selectedDemoScenarioId);
    const validation = readArchLucidAzurePackageZipFromBytes(bytes);

    if (!validation.ok) {
      setUploadError({
        message: validation.message,
        problem: null,
        correlationId: null,
      });

      return;
    }

    const demoFile = new File([new Uint8Array(bytes)], scenario.zipFilename, {
      type: "application/zip",
    });
    setSelectedFileLabel(`${demoFile.name} (bundled demo)`);
    await onUpload(demoFile);
  }

  async function onUpload(file: File) {
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/proxy/v1/azure-extractor/upload",
        mergeRegistrationScopeForProxy({
          method: "POST",
          body: formData,
        }),
      );

      const bodyText = await response.text();
      const correlationId = response.headers.get("X-Correlation-ID");

      if (!response.ok) {
        const apiError = buildApiRequestErrorFromParts(response, bodyText);
        setUploadError({
          message: apiError.message,
          problem: apiError.problem,
          correlationId: apiError.correlationId ?? correlationId,
        });
        const presentation = parseAzureExtractorUploadFailure(
          apiError.problem,
          apiError.message,
          apiError.correlationId ?? correlationId,
        );
        showError("Azure upload", presentation.heading);

        return;
      }

      try {
        const payload = JSON.parse(bodyText) as { packageId?: string };
        setPackageId(payload.packageId ?? null);
      } catch {
        setPackageId(null);
      }

      showSuccess("Azure package uploaded — open Reviews to attach it to a review.");
    } finally {
      setBusy(false);
    }
  }

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

          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{EXTRACT_UPLOAD_STEP_UPLOAD_TITLE}</CardTitle>
              <CardDescription>
                {EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION} (max {maxMb} MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AzureExtractorZipDropZone
                ariaLabel="Azure extractor ZIP upload"
                busy={busy}
                testId="extract-upload-drop-zone"
                hint={
                  selectedFileLabel !== null ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
                      data-testid="extract-upload-file-meta"
                    >
                      Selected: {selectedFileLabel}
                    </p>
                  ) : null
                }
                onZipSelected={onZipSelected}
                onFolderSelected={onFolderSelected}
              />
              <ExtractUploadFileProgressList fileStatuses={fileStatuses} />
              {uploadError !== null ? (
                <AzureExtractorUploadFailureCallout
                  fallbackMessage={uploadError.message}
                  problem={uploadError.problem}
                  correlationId={uploadError.correlationId}
                />
              ) : null}
              {packageId !== null ? (
                <p
                  className={cn("m-0 text-emerald-800 dark:text-emerald-300", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="extract-upload-success"
                >
                  Package accepted (<span className="font-mono">{packageId}</span>).
                </p>
              ) : null}
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/architecture/reviews" data-testid="extract-upload-go-reviews">
                  Go to Reviews
                </Link>
              </Button>
            </CardContent>
          </Card>
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
            <p className={cn("m-0 mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <code
                className={cn(
                  "inline-block whitespace-pre-wrap break-words rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800",
                  OPERATOR_TYPOGRAPHY.micro,
                )}
              >
                {EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND}
              </code>
            </p>
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
