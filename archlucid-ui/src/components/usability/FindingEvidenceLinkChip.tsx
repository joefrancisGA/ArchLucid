import { cn } from "@/lib/utils";
import Link from "next/link";

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
    // Deliberately link-styled (underline, no border/background) rather than badge-shaped — this is an
    // interactive navigation affordance, not a status/metadata chip (`StatusTag`), and must not be mistaken
    // for noninteractive content (TB-619).
    <Link
      href={props.href}
      prefetch={false}
      className={cn(
        "inline-flex items-center font-medium text-al-accent-interactive underline decoration-al-accent-interactive/50 underline-offset-2 hover:decoration-al-accent-interactive",
        OPERATOR_TYPOGRAPHY.badge,
        props.className,
      )}
      data-testid="finding-evidence-link-chip"
    >
      {label}
    </Link>
  );
}
