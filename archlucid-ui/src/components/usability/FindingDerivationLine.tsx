import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingDerivationResult } from "@/lib/findings/finding-derivation-sentence";
import { cn } from "@/lib/utils";

export type FindingDerivationLineProps = {
  readonly derivation: FindingDerivationResult;
  readonly evidenceHref?: string | null;
  readonly testId?: string;
  readonly compact?: boolean;
};

/** One-sentence finding derivation with optional evidence-trail expand (TB-2154). */
export function FindingDerivationLine(props: FindingDerivationLineProps): React.JSX.Element {
  const { derivation, evidenceHref, testId = "finding-derivation-line", compact = false } = props;
  const evidenceLink =
    evidenceHref !== null && evidenceHref !== undefined && evidenceHref.trim().length > 0 ? evidenceHref : null;

  if (compact) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={testId}>
        <span data-testid={`${testId}-sentence`}>{derivation.sentence}</span>
        {evidenceLink !== null ? (
          <>
            {" "}
            <Link
              href={evidenceLink}
              prefetch={false}
              className={cn("font-medium", OPERATOR_LINK.inline)}
              data-testid={`${testId}-evidence-link`}
            >
              Show evidence
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div className="space-y-1" data-testid={testId}>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid={`${testId}-sentence`}>
        {derivation.sentence}
      </p>
      {evidenceLink !== null ? (
        <details className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <summary className="cursor-pointer select-none font-medium text-al-text-primary">Show evidence</summary>
          <p className="m-0 mt-1">
            <Link
              href={evidenceLink}
              prefetch={false}
              className={cn("font-medium", OPERATOR_LINK.inline)}
              data-testid={`${testId}-evidence-link`}
            >
              Open evidence trail
            </Link>
          </p>
        </details>
      ) : null}
    </div>
  );
}
