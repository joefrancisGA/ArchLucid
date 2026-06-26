"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { showSuccess } from "@/lib/toast";

type WizardEvidenceUploadZoneProps = {
  readonly title?: string;
  readonly description?: string;
  readonly accept?: string;
  readonly onFilesSelected?: (files: File[]) => void;
};

const DEFAULT_ACCEPTED_EXTENSIONS = ".pdf,.docx,.md,.txt,.json,.yaml,.yml,.png,.jpg,.jpeg";

/** Drag-drop evidence upload with format hints for the review wizard. */
export function WizardEvidenceUploadZone(props: WizardEvidenceUploadZoneProps) {
  const acceptedExtensions = props.accept ?? DEFAULT_ACCEPTED_EXTENSIONS;
  const [files, setFiles] = useState<File[]>([]);

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

      const list = Array.from(incoming);
      syncFiles(list);
      showSuccess(`${list.length} file${list.length === 1 ? "" : "s"} ready for intake`);
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
    <div
      className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/80 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
      data-testid="wizard-evidence-upload-zone"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {props.title ?? "Attach evidence (optional)"}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.description ??
          "Accepted: PDF, DOCX, Markdown, text, JSON, YAML, images. Drag files here or browse."}
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
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Need an example?{" "}
        <Link
          href="/help/evidence-intake"
          className="font-medium text-teal-800 underline dark:text-teal-300"
        >
          View the start review guide
        </Link>
        .
      </p>
      {files.length > 0 ? (
        <div className="mt-3 space-y-2" data-testid="wizard-evidence-upload-attachments">
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>Attached evidence</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className={cn("inline-flex max-w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
              >
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 font-medium text-neutral-600 underline-offset-2 hover:text-red-700 hover:underline dark:text-neutral-400 dark:hover:text-red-400"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    removeFile(index);
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
