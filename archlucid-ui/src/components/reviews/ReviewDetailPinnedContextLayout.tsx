import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReviewDetailPinnedContextLayoutProps = {
  readonly pinOpen: boolean;
  readonly panel: ReactNode | null;
  readonly children: ReactNode;
};

/** Flex shell: primary workspace stays full-width tab strip; pin docks as a right aside (DR-11). */
export function ReviewDetailPinnedContextLayout(props: ReviewDetailPinnedContextLayoutProps): React.JSX.Element {
  return (
    <div
      className={cn("flex min-w-0 items-stretch gap-0", props.pinOpen && "lg:gap-0")}
      data-testid="review-detail-pinned-context-layout"
      data-pin-open={props.pinOpen ? "true" : "false"}
    >
      <div className="min-w-0 flex-1">{props.children}</div>
      {props.pinOpen && props.panel !== null ? props.panel : null}
    </div>
  );
}
