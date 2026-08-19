import { cn } from "@/lib/utils";
import type { FolderPackageFileStatus } from "@/lib/read-arch-lucid-azure-folder-package";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type ExtractUploadFileProgressListProps = {
  readonly fileStatuses: readonly FolderPackageFileStatus[];
};

/** Per-file status list after folder packaging or ZIP validation. */
export function ExtractUploadFileProgressList(props: ExtractUploadFileProgressListProps) {
  if (props.fileStatuses.length === 0) {
    return null;
  }

  return (
    <ul className={cn("m-0 max-h-40 list-none space-y-1 overflow-y-auto rounded border border-neutral-200 p-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)} data-testid="extract-upload-file-progress">
      {props.fileStatuses.map((file) => (
        <li key={file.name} className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="truncate font-mono text-neutral-800 dark:text-neutral-200">{file.name}</span>
          <span
            className={
              file.status === "included"
                ? "text-teal-800 dark:text-teal-300"
                : file.status === "failed"
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-neutral-500"
            }
          >
            {file.status}
            {file.message !== undefined ? ` — ${file.message}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
