"use client";

import Link from "next/link";
import { useState } from "react";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";

const EXTRACTOR_SCRIPT_CDN_URL =
  process.env.NEXT_PUBLIC_EXTRACTOR_SCRIPT_CDN_URL?.trim() ||
  "https://cdn.archlucid.net/scripts/Get-ArchLucidAzurePackage.ps1";

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

  async function onUpload(file: File) {
    setBusy(true);
    setSelectedFileLabel(`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);
    setUploadError(null);
    setPackageId(null);

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
        showError("Azure upload", apiError.message);

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
          <CardDescription>Server validates manifest schema; 422 errors show inline below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            aria-label="Azure extractor ZIP upload"
            data-testid="extract-upload-file-input"
            className="block w-full text-sm"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file === undefined) {
                return;
              }

              void onUpload(file);
              event.currentTarget.value = "";
            }}
          />
          {selectedFileLabel !== null ? (
            <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" data-testid="extract-upload-file-meta">
              Selected: {selectedFileLabel}
            </p>
          ) : null}
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
