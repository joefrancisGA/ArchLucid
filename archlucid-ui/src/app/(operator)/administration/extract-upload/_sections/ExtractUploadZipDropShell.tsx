"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { ExtractUploadFileProgressList } from "@/components/usability/ExtractUploadFileProgressList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL,
  EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_UPLOAD_TITLE,
} from "@/lib/extract-upload-settings-page-copy";

import type { ExtractUploadSettingsViewModel } from "./use-extract-upload-settings";

export type ExtractUploadZipDropShellProps = Pick<
  ExtractUploadSettingsViewModel,
  | "maxMb"
  | "busy"
  | "selectedFileLabel"
  | "uploadError"
  | "packageId"
  | "fileStatuses"
  | "onFolderSelected"
  | "onZipSelected"
>;

export function ExtractUploadZipDropShell(props: ExtractUploadZipDropShellProps) {
  const {
    maxMb,
    busy,
    selectedFileLabel,
    uploadError,
    packageId,
    fileStatuses,
    onFolderSelected,
    onZipSelected,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{EXTRACT_UPLOAD_STEP_UPLOAD_TITLE}</CardTitle>
        <CardDescription>
          {EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION} (max {maxMb} MB).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AzureExtractorZipDropZone
          ariaLabel={EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL}
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
  );
}
