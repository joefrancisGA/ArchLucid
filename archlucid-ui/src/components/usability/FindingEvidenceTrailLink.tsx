import Link from "next/link";

type FindingEvidenceTrailLinkProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly label?: string;
};

/** One-click jump from a finding to its slice of the evidence trail graph. */
export function FindingEvidenceTrailLink(props: FindingEvidenceTrailLinkProps) {
  const encodedRun = encodeURIComponent(props.runId);
  const encodedFinding = encodeURIComponent(props.findingId);
  const href = `/graph?runId=${encodedRun}&findingId=${encodedFinding}&mode=review-trail`;

  return (
    <Link
      href={href}
      className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
      data-testid="finding-evidence-trail-link"
    >
      {props.label ?? "Explain in evidence trail"}
    </Link>
  );
}
