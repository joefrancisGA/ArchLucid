"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { UploadCloud } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

import { AzureExtractorUploadProgressBar } from "@/components/AzureExtractorUploadProgressBar";
import { AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE, isAzureExtractorZipFile } from "@/lib/is-azure-extractor-zip-file";

export type InventoryZipDropZoneProps = {
  ariaLabel: string;
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  hint?: ReactNode;
  testId?: string;
  onZipSelected: (file: File) => void | Promise<void>;
  onInvalidFile?: (message: string) => void;
  /** When set, enables folder selection (webkitdirectory) for zip-less extractor uploads. */
  onFolderSelected?: (files: FileList) => void | Promise<void>;
};

/** Cloud-neutral ZIP drop zone for Tier-1 inventory packages (Azure, AWS, GCP). */
export function InventoryZipDropZone(props: InventoryZipDropZoneProps) {
  const {
    ariaLabel,
    busy = false,
    busyLabel = "Reading inventory package…",
    disabled = false,
    hint,
    testId,
    onZipSelected,
    onInvalidFile,
    onFolderSelected,
  } = props;
  const inputId = useId();
  const folderInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isDisabled = disabled || busy;

  async function handleFile(file: File | null | undefined): Promise<void> {
    if (file === null || file === undefined || isDisabled) {
      return;
    }

    if (!isAzureExtractorZipFile(file)) {
      onInvalidFile?.(AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE);

      return;
    }

    await onZipSelected(file);
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={isDisabled}
        aria-label={ariaLabel}
        data-testid={testId ? `${testId}-surface` : "inventory-zip-drop-surface"}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragActive
            ? "border-neutral-400 bg-al-surface-raised dark:border-neutral-600"
            : "border-neutral-300 bg-neutral-50/80 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900/40 dark:hover:border-neutral-500",
          isDisabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => {
          if (!isDisabled) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (isDisabled) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!isDisabled) {
            setDragActive(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();

          if (!isDisabled) {
            setDragActive(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);

          if (isDisabled) {
            return;
          }

          const file = event.dataTransfer.files?.[0];
          void handleFile(file);
        }}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-neutral-500 dark:text-neutral-400" aria-hidden />
        <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Drag and drop your inventory ZIP here
        </p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          or click to browse (.zip{onFolderSelected !== undefined ? " or folder" : ""})
        </p>
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        disabled={isDisabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        data-testid={testId ? `${testId}-input` : "inventory-zip-drop-input"}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          void handleFile(file);
          event.currentTarget.value = "";
        }}
      />
      {onFolderSelected !== undefined ? (
        <>
          <input
            id={folderInputId}
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is supported in Chromium-based browsers
            webkitdirectory=""
            directory=""
            multiple
            disabled={isDisabled}
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
            data-testid={testId ? `${testId}-folder-input` : "inventory-folder-input"}
            onChange={(event) => {
              const files = event.currentTarget.files;

              if (files !== null && files.length > 0) {
                void onFolderSelected(files);
              }

              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
            disabled={isDisabled}
            onClick={() => folderInputRef.current?.click()}
          >
            Select extractor folder instead of ZIP
          </button>
        </>
      ) : null}
      {busy ? (
        <AzureExtractorUploadProgressBar
          label={busyLabel}
          testId={testId ? `${testId}-progress` : "inventory-zip-drop-progress"}
        />
      ) : null}
      {hint}
    </div>
  );
}
