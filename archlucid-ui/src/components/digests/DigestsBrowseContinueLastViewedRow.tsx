"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { DigestsBrowseContinueLastTarget } from "@/lib/resolve-continue-last-digest-browse";
import { cn } from "@/lib/utils";

export type DigestsBrowseContinueLastViewedRowProps = {
  readonly target: DigestsBrowseContinueLastTarget;
  readonly onOpen: (digestId: string) => void;
};

/** Pinned continue row for the most recently opened digest history entry. */
export function DigestsBrowseContinueLastViewedRow(
  props: DigestsBrowseContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="digests-browse-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="digests-browse-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="digests-browse-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed digest
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.title}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="digests-browse-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.digestId);
          }}
        >
          Open digest
        </Button>
      </div>
    </section>
  );
}
