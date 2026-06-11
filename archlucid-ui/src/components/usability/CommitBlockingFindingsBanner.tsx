import Link from "next/link";

import { OperatorWarningCallout } from "@/components/OperatorShellMessage";

export type CommitBlockingFindingLink = {
  readonly findingId: string;
  readonly title: string;
};

type CommitBlockingFindingsBannerProps = {
  readonly runId: string;
  readonly blockingFindings: readonly CommitBlockingFindingLink[];
};

/** Prominent banner listing findings that block finalization, with jump links. */
export function CommitBlockingFindingsBanner(props: CommitBlockingFindingsBannerProps) {
  if (props.blockingFindings.length === 0) {
    return null;
  }

  return (
    <OperatorWarningCallout>
      <strong>
        {props.blockingFindings.length} blocking finding{props.blockingFindings.length === 1 ? "" : "s"} — finalize when resolved
      </strong>
      <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm">
        {props.blockingFindings.map((finding) => (
          <li key={finding.findingId}>
            <Link
              href={`/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(finding.findingId)}`}
              className="font-medium text-teal-900 underline dark:text-teal-200"
            >
              {finding.title}
            </Link>
          </li>
        ))}
      </ul>
    </OperatorWarningCallout>
  );
}
