"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { ApiV1Routes } from "@/lib/api-v1-routes";

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
  const [extractorUpdateBanner, setExtractorUpdateBanner] = useState<string | null>(null);
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [baselineResponse, scriptResponse] = await Promise.all([
          fetch(
            `/api/proxy/${ApiV1Routes.tenantWorkspaceBaselineArtifacts}`,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
          ),
          fetch(EXTRACTOR_SCRIPT_CDN_URL, { cache: "no-store" }),
        ]);

        if (!baselineResponse.ok || !scriptResponse.ok || cancelled) {
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
      cancelled = true;
    };
  }, []);

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

      showSuccess("Azure package uploaded — open Reviews to attach it to a run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Extract &amp; Upload</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Run the read-only Azure extractor locally, validate the ZIP, then upload it for architecture reviews.
        </p>
      </div>

      {extractorUpdateBanner ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          data-testid="extractor-version-banner"
        >
          {extractorUpdateBanner}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Download script</CardTitle>
          <CardDescription>Inspect the script before running it in your Azure tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <a
            href={EXTRACTOR_SCRIPT_CDN_URL}
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            target="_blank"
            rel="noreferrer"
          >
            Download Get-ArchLucidAzurePackage.ps1
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 — Run locally</CardTitle>
          <CardDescription>Use <code>-DryRun</code> first to preview inventory without writing files.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-neutral-950 p-3 text-xs text-neutral-100">
            {buildGetArchLucidAzurePackageCommandLine()}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 3 — Validate (optional)</CardTitle>
          <CardDescription>CLI validation before upload.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            archlucid azure validate-zip --path &lt;your-package.zip&gt;
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 4 — Upload ZIP</CardTitle>
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
                <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" data-testid="extract-upload-file-meta">
                  Selected: {selectedFileLabel}
                </p>
              ) : null
            }
            onZipSelected={onZipSelected}
          />
          {uploadError !== null ? (
            <AzureExtractorUploadFailureCallout
              fallbackMessage={uploadError.message}
              problem={uploadError.problem}
              correlationId={uploadError.correlationId}
            />
          ) : null}
          {packageId !== null ? (
            <p className="m-0 text-sm text-emerald-800 dark:text-emerald-300" data-testid="extract-upload-success">
              Package accepted (<span className="font-mono">{packageId}</span>).
            </p>
          ) : null}
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/reviews" data-testid="extract-upload-go-reviews">
              Go to Reviews
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
