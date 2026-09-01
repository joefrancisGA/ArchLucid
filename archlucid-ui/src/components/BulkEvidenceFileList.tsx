"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { X } from "lucide-react";

type BulkEvidenceFileListProps = {
  readonly files: File[];
  readonly uploading: boolean;
  readonly onRemoveFile: (index: number) => void;
};

export function BulkEvidenceFileList({ files, uploading, onRemoveFile }: BulkEvidenceFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto rounded border border-neutral-200 bg-al-surface-raised p-2 dark:border-neutral-700">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className={cn(
            "flex items-center justify-between gap-2 p-1 hover:bg-[var(--al-layer-hover)]",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <span className="min-w-0 flex-1 break-all text-al-text-primary">{f.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(i);
            }}
            className="shrink-0 p-1 text-neutral-500 hover:text-red-500"
            aria-label={`Remove ${f.name}`}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
