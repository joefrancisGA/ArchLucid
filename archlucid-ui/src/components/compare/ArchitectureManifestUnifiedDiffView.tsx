import { cn } from "@/lib/utils";
import {
  buildArchitectureManifestUnifiedLines,
  type ArchitectureManifestUnifiedLine,
} from "@/lib/architecture-manifest-line-diff";

function rowClass(line: ArchitectureManifestUnifiedLine): string {
  if (line.kind === "add") {
    return "bg-emerald-100/80 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100";
  }

  if (line.kind === "remove") {
    return "bg-red-100/80 text-red-950 dark:bg-red-950/45 dark:text-red-100";
  }

  return "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100";
}

export type ArchitectureManifestUnifiedDiffViewProps = {
  baselineLabel: string;
  updatedLabel: string;
  beforeText: string;
  afterText: string;
};

/**
 * Unified line diff (Git-style prefixes) with scroll clipping for large manifest JSON.
 */
export function ArchitectureManifestUnifiedDiffView(props: ArchitectureManifestUnifiedDiffViewProps) {
  const rows = buildArchitectureManifestUnifiedLines(props.beforeText, props.afterText);

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className="m-0 border-b border-neutral-200 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">{props.baselineLabel}</span>
        <span aria-hidden="true" className="mx-2 text-neutral-400">
          →
        </span>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">{props.updatedLabel}</span>
      </p>
      <div
        className="max-h-[min(70vh,36rem)] overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        tabIndex={0}
        role="region"
        aria-label="Unified line diff of baseline and updated manifest JSON"
      >
        <table className="w-full border-collapse text-left font-mono text-[12px] leading-snug">
          <caption className="sr-only">
            Lines prefixed with minus were removed from the baseline manifest; lines prefixed with plus were added in
            the updated manifest; blank prefix lines are unchanged context.
          </caption>
          <tbody>
            {rows.map((line, index) => (
              <tr key={index} className={cn("align-top", rowClass(line))}>
                <td className="w-8 shrink-0 select-none whitespace-nowrap py-px pr-1 pl-2 text-right text-[10px] text-neutral-500 dark:text-neutral-500">
                  {index + 1}
                </td>
                <td className="w-5 shrink-0 select-none whitespace-nowrap py-px text-center font-semibold text-neutral-600 dark:text-neutral-400">
                  {line.prefix}
                </td>
                <td className="min-w-[12rem] whitespace-pre-wrap break-all py-px pr-3">{line.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
