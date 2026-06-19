"use client";

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
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files === null || files.length === 0) {
        return;
      }

      const list = Array.from(files);
      setFileNames(list.map((file) => file.name));
      props.onFilesSelected?.(list);
      showSuccess(`${list.length} file${list.length === 1 ? "" : "s"} ready for intake`);
    },
    [props],
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
      <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {props.title ?? "Attach evidence (optional)"}
      </p>
      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
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
        <Link
          href="/help/evidence-intake"
          className="text-xs font-medium text-teal-800 underline dark:text-teal-300"
        >
          Start review guide
        </Link>
      </div>
      {fileNames.length > 0 ? (
        <ul className="m-0 mt-2 list-disc pl-5 text-xs text-neutral-700 dark:text-neutral-300">
          {fileNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
