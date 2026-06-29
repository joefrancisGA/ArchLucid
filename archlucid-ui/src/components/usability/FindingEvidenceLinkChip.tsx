import { cn } from "@/lib/utils";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingEvidenceLinkChipProps = {
  readonly href: string;
  readonly evidenceRefCount?: number | null;
  readonly className?: string;
};

/** Compact per-finding evidence affordance — surfaces linkage count before the reviewer opens the graph. */
export function FindingEvidenceLinkChip(props: FindingEvidenceLinkChipProps): React.JSX.Element {
  const count =
    typeof props.evidenceRefCount === "number" && Number.isFinite(props.evidenceRefCount)
      ? Math.max(0, Math.trunc(props.evidenceRefCount))
      : null;

  const label =
    count !== null && count > 0
      ? `Evidence: ${count} linked`
      : "Evidence trail";

  return (
    <Link
      href={props.href}
      className={cn(
        "inline-flex items-center rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-medium text-al-accent-interactive underline-offset-2 hover:underline dark:border-neutral-600 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.badge,
        props.className,
      )}
      data-testid="finding-evidence-link-chip"
    >
      {label}
    </Link>
  );
}
