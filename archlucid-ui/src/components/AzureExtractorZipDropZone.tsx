"use client";

import { UploadCloud } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AzureExtractorZipDropZoneProps = {
  ariaLabel: string;
  busy?: boolean;
  disabled?: boolean;
  hint?: ReactNode;
  testId?: string;
  onZipSelected: (file: File) => void | Promise<void>;
};

/**
 * Drag-and-drop surface for Tier 1 Azure extractor ZIP uploads (wizard + settings).
 */
export function AzureExtractorZipDropZone(props: AzureExtractorZipDropZoneProps) {
  const { ariaLabel, busy = false, disabled = false, hint, testId, onZipSelected } = props;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isDisabled = disabled || busy;

  async function handleFile(file: File | null | undefined): Promise<void> {
    if (file === null || file === undefined || isDisabled) {
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
        data-testid={testId ? `${testId}-surface` : "azure-extractor-zip-drop-surface"}
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
        <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-100">
          Drag and drop your Azure packager ZIP here
        </p>
        <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">or click to browse (.zip)</p>
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
        data-testid={testId ? `${testId}-input` : "azure-extractor-zip-drop-input"}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          void handleFile(file);
          event.currentTarget.value = "";
        }}
      />
      {hint}
    </div>
  );
}
