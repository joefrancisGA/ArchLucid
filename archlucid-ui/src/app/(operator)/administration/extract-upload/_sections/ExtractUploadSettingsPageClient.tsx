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
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const EXTRACTOR_SCRIPT_CDN_URL =
  process.env.NEXT_PUBLIC_EXTRACTOR_SCRIPT_CDN_URL?.trim() ||
  "https://cdn.archlucid.net/scripts/Get-ArchLucidAzurePackage.ps1";

const EXTRACTOR_SCRIPT_VERSION_PATTERN = /\$scriptVersion\s*=\s*"([^"]+)"/;

/**
 * Guided Extract & Upload settings page — PowerShell script, validate hint, and server ZIP upload.
 */
export function ExtractUploadSettingsPageClient() {
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
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const [baselineResponse, scriptResponse] = await Promise.all([
          fetch(
            `/api/proxy/${ApiV1Routes.tenantWorkspaceBaselineArtifacts}`,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
          ),
          fetch(EXTRACTOR_SCRIPT_CDN_URL, { cache: "no-store" }),
        ]);

        if (!baselineResponse.ok || !scriptResponse.ok || canceled) {
          return;
        }

        const baseline = (await baselineResponse.json()) as { extractorScriptVersion?: string | null };
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
        // Banner is optional; ignore fetch failures.
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
      showError("Azure upload", built.message);

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
      showError("Azure upload", validation.message);

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
      showError("Azure upload", validation.message);

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
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Extract &amp; Upload</h1>
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Run the read-only Azure extractor locally, validate the ZIP, then upload it for architecture reviews.
          </p>
        </div>
        <PageContextualHelpButton />
      </div>

      <ExtractUploadCloudConnectionsVocabularyRail currentSurfaceId="extract-upload" />

      <ExtractUploadConstraintsPanel />

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

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Step 1 — Collect inventory locally</CardTitle>
          <CardDescription>
            Copy the quick-start command, run it from your ArchLucid checkout, then upload the ZIP below. Use{" "}
            <code>-DryRun</code> on the advanced script when you need a preview first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AzureExtractorQuickStartCommandPanel testIdPrefix="extract-upload-quick-start" />
          <details className={cn("rounded-md border border-neutral-200 p-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Advanced: full Get-ArchLucidAzurePackage.ps1 command
            </summary>
            <pre
              className={cn(
                "mt-3 overflow-x-auto rounded-md bg-neutral-950 p-3 text-neutral-100",
                OPERATOR_TYPOGRAPHY.micro,
              )}
            >
              {buildAdvancedGetArchLucidAzurePackageCommandLine()}
            </pre>
          </details>
          <a
            href={EXTRACTOR_SCRIPT_CDN_URL}
            className={cn("inline-block", OPERATOR_LINK.nav)}
            target="_blank"
            rel="noreferrer"
          >
            Download Get-ArchLucidAzurePackage.ps1 (inspect before running)
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Step 2 — Validate (optional)</CardTitle>
          <CardDescription>CLI validation before upload.</CardDescription>
        </CardHeader>
        <CardContent className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
            archlucid azure validate-zip --path &lt;your-package.zip&gt;
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Try it now with demo data</CardTitle>
          <CardDescription>
            Upload a bundled synthetic Azure extractor ZIP — same schema as{" "}
            <code>Get-ArchLucidAzurePackage.ps1</code> output — without running the extractor locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Step 3 — Upload ZIP</CardTitle>
          <CardDescription>
            Drag and drop or browse. Client-side checks validate <code>manifest.json</code> schemaVersion before the API
            call (max {maxMb} MB).
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
  );
}
