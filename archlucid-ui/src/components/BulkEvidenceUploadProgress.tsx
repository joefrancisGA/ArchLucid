"use client";
import { cn } from "@/lib/utils";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";

export type BulkEvidenceUploadProgressProps = {
  readonly uploading: boolean;
  readonly progressPercent: number;
  readonly etaLabel: string | null;
  readonly onCancelUpload: () => void;
};

export function BulkEvidenceUploadProgress({
  uploading,
  progressPercent,
  etaLabel,
  onCancelUpload,
}: BulkEvidenceUploadProgressProps) {
  if (!uploading) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="bulk-evidence-upload-progress">
      <LongOperationWaitNotice
        active={uploading}
        operationLabel="Uploading evidence"
        stageLabel="Transferring files to ArchLucid"
        testId="bulk-evidence-long-wait"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancelUpload}
        className={CTA_WIDTH.content}
        data-testid="bulk-evidence-upload-cancel"
      >
        Cancel upload
      </Button>
      <Progress value={progressPercent} className="h-2 w-full" aria-label="Upload progress" />
      <div className={cn("flex justify-between text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span>{progressPercent}%</span>
        {etaLabel ? <span>{etaLabel}</span> : null}
      </div>
    </div>
  );
}
