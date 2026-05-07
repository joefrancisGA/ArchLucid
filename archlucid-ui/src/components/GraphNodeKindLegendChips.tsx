import { cn } from "@/lib/utils";

const KINDS: ReadonlyArray<{ k: string; c: string }> = [
  { k: "Decision", c: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200" },
  { k: "Finding", c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" },
  { k: "Artifact", c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100" },
  { k: "Review", c: "bg-teal-100 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100" },
  { k: "Component", c: "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100" },
];

/**
 * Compact legend chips for graph node categories — shown in idle state and when the interactive graph is visible.
 */
export function GraphNodeKindLegendChips(props: { className?: string }) {
  return (
    <ul className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}>
      {KINDS.map((x) => (
        <li
          key={x.k}
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${x.c}`}
        >
          {x.k}
        </li>
      ))}
    </ul>
  );
}
