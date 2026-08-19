import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";

type FindingEvidenceTrailLinkProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly label?: string;
};

/** One-click jump from a finding to its evidence-trace drill-down. */
export function FindingEvidenceTrailLink(props: FindingEvidenceTrailLinkProps) {
  const href = getFindingEvidenceTraceHref(props.runId, props.findingId);

  return (
    <Link
      href={href}
      className={OPERATOR_BODY_INLINE_LINK_CLASS}
      data-testid="finding-evidence-trail-link"
    >
      {props.label ?? "Explain in evidence trail"}
    </Link>
  );
}
