"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK } from "@/lib/design-tokens";

export type HealthSectionJumpLinkProps = {
  readonly targetId: string;
  readonly children: string;
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Same-page jump to an already-rendered health section. Anchor semantics (not a button)
 * per the accessibility baseline; focus follows the scroll so keyboard users land there too.
 */
export function HealthSectionJumpLink(props: HealthSectionJumpLinkProps): React.JSX.Element {
  return (
    <a
      href={`#${props.targetId}`}
      className={cn(OPERATOR_LINK.nav, props.className)}
      data-testid={props.testId}
      onClick={(event) => {
        const target = document.getElementById(props.targetId);

        if (target === null) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.focus({ preventScroll: true });
      }}
    >
      {props.children}
    </a>
  );
}
