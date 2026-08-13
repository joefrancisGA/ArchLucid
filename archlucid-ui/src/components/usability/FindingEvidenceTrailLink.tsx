import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      className={cn("font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}
      data-testid="finding-evidence-trail-link"
    >
      {props.label ?? "Explain in evidence trail"}
    </Link>
  );
}
