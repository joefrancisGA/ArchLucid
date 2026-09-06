import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDING_EVIDENCE_LINK_GRAPH_LABEL,
  FINDING_EVIDENCE_LINK_VIEW_GRAPH_ACCESSIBLE_LABEL,
  FINDING_EVIDENCE_LINK_VIEW_GRAPH_LABEL,
} from "@/lib/vocabulary/finding-evidence-link-chip-copy";

export type FindingEvidenceLinkChipProps = {
  readonly href: string;
  readonly evidenceRefCount?: number | null;
  readonly className?: string;
  /**
   * `column` omits the "Evidence" prefix when a table header already names the column —
   * matches StatusTag / SeverityTag cells that show the value only.
   */
  readonly labelScope?: "standalone" | "column";
};

/** Compact per-finding evidence affordance — surfaces linkage count before the reviewer opens the graph. */
function resolveFindingEvidenceLinkLabel(
  count: number | null,
  labelScope: FindingEvidenceLinkChipProps["labelScope"],
): { readonly visible: string; readonly accessible: string } {
  const useColumnScope = labelScope === "column";

  if (count !== null && count > 0) {
    return useColumnScope
      ? { visible: `${count} linked`, accessible: `Evidence: ${count} linked` }
      : { visible: `Evidence: ${count} linked`, accessible: `Evidence: ${count} linked` };
  }

  return useColumnScope
    ? { visible: FINDING_EVIDENCE_LINK_VIEW_GRAPH_LABEL, accessible: FINDING_EVIDENCE_LINK_VIEW_GRAPH_ACCESSIBLE_LABEL }
    : { visible: FINDING_EVIDENCE_LINK_GRAPH_LABEL, accessible: FINDING_EVIDENCE_LINK_GRAPH_LABEL };
}

export function FindingEvidenceLinkChip(props: FindingEvidenceLinkChipProps): React.JSX.Element {
  const count =
    typeof props.evidenceRefCount === "number" && Number.isFinite(props.evidenceRefCount)
      ? Math.max(0, Math.trunc(props.evidenceRefCount))
      : null;
  const labelScope = props.labelScope ?? "standalone";
  const label = resolveFindingEvidenceLinkLabel(count, labelScope);
  const useInlineLinkStyle = labelScope === "column";
  const inlineLinkClassName = cn(OPERATOR_TYPE_SCALE.body, OPERATOR_LINK.inline);

  return (
    // Deliberately link-styled (underline, no border/background) rather than badge-shaped — this is an
    // interactive navigation affordance, not a status/metadata chip (`StatusTag`), and must not be mistaken
    // for noninteractive content (TB-619). In table columns, match neighboring `OPERATOR_LINK.inline` cells.
    <Link
      href={props.href}
      prefetch={false}
      className={cn(
        useInlineLinkStyle
          ? inlineLinkClassName
          : cn(
              "inline-flex items-center font-medium text-al-accent-interactive underline decoration-al-accent-interactive/50 underline-offset-2 hover:decoration-al-accent-interactive",
              OPERATOR_TYPOGRAPHY.badge,
            ),
        props.className,
      )}
      data-testid="finding-evidence-link-chip"
      aria-label={label.accessible}
    >
      {label.visible}
    </Link>
  );
}
