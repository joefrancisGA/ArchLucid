"use client";
import {
  EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR,
  EVIDENCE_UPLOAD_ACCEPTED_FORMATS_ACCEPTED_PREFIX,
} from "@/lib/evidence-upload-accepted-formats";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type WizardEvidenceUploadZoneProps = {
  readonly title?: string;
  readonly description?: string;
  readonly accept?: string;
  readonly labelId?: string;
  /** Optional suffix after the file count, e.g. "architecture context optional". */
  readonly attachmentSummarySuffix?: string;
  readonly onFilesSelected?: (files: File[]) => void;
};

export function formatWizardEvidenceAttachmentSummary(
  fileCount: number,
  suffix?: string,
): string {
  if (fileCount === 0) {
    return "";
  }

  const countLabel = `${fileCount} file${fileCount === 1 ? "" : "s"} attached`;
  const trimmedSuffix = suffix?.trim();

  if (trimmedSuffix === undefined || trimmedSuffix.length === 0) {
    return countLabel;
  }

  return `${countLabel} — ${trimmedSuffix}`;
}

const DEFAULT_LABEL = "Attach evidence (optional)";
const DEFAULT_DESCRIPTION = `${EVIDENCE_UPLOAD_ACCEPTED_FORMATS_ACCEPTED_PREFIX}. Drag files here or browse.`;
const ACCEPTED_LABEL = "Accepted:";

function renderWizardEvidenceUploadDescription(description: string): ReactNode {
  const acceptedIndex = description.indexOf(ACCEPTED_LABEL);

  if (acceptedIndex === -1) {
    return description;
  }

  return (
    <>
      {description.slice(0, acceptedIndex)}
      <span className="font-semibold">{ACCEPTED_LABEL}</span>
      {description.slice(acceptedIndex + ACCEPTED_LABEL.length)}
    </>
  );
}

/** Drag-drop evidence upload with the same label + helper + control layout as other intake fields. */
export function WizardEvidenceUploadZone(props: WizardEvidenceUploadZoneProps) {
  const acceptedExtensions = props.accept ?? EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR;
  const labelId = props.labelId ?? "wizard-evidence-upload";
  const label = props.title ?? DEFAULT_LABEL;
  const description = props.description ?? DEFAULT_DESCRIPTION;
  const [files, setFiles] = useState<File[]>([]);
  const attachmentSummary = formatWizardEvidenceAttachmentSummary(
    files.length,
    props.attachmentSummarySuffix,
  );

  const syncFiles = useCallback(
    (nextFiles: File[]) => {
      setFiles(nextFiles);
      props.onFilesSelected?.(nextFiles);
    },
    [props],
  );

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (incoming === null || incoming.length === 0) {
        return;
      }

      syncFiles(Array.from(incoming));
    },
    [syncFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      syncFiles(files.filter((_, fileIndex) => fileIndex !== index));
    },
    [files, syncFiles],
  );

  return (
    <div className="space-y-2" data-testid="wizard-evidence-upload-zone">
      <Label htmlFor={labelId}>{label}</Label>
      <div
        id={labelId}
        className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/80 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Drag files here or browse.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              Browse files
              <input
                type="file"
                className="sr-only"
                multiple
                accept={acceptedExtensions}
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              Browse folder
              <input
                type="file"
                className="sr-only"
                multiple
                // @ts-expect-error - webkitdirectory is a non-standard attribute but supported in modern browsers
                webkitdirectory=""
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
          </Button>
        </div>
        {files.length > 0 ? (
          <div className="mt-3 space-y-2" data-testid="wizard-evidence-upload-attachments">
            <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              Attached evidence
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex max-w-full items-center gap-2"
                  data-testid={`wizard-evidence-upload-attachment-${index}`}
                >
                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    <span className="break-all">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => {
                      removeFile(index);
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {/* Mounted even when empty so assistive tech announces attachment changes; a region added at the
          same moment its text appears is not reliably announced. */}
      <p
        className={cn(
          "m-0",
          files.length > 0 ? "text-neutral-700 dark:text-neutral-300" : "sr-only",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        role="status"
        data-testid="wizard-evidence-upload-summary"
      >
        {attachmentSummary}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        {renderWizardEvidenceUploadDescription(description)}
      </p>
    </div>
  );
}
