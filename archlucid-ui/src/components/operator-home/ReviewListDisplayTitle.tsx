import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReviewListDisplayTitleProps = {
  readonly href: string;
  readonly title: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Clamped review title with full text reveal on hover or keyboard focus (P2-15). */
export function ReviewListDisplayTitle(props: ReviewListDisplayTitleProps): React.JSX.Element {
  return (
    <Link
      href={props.href}
      className={cn(
        "group/title block min-w-0 font-medium leading-snug",
        OPERATOR_LINK.nav,
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      aria-label={props.title}
      data-testid={props.testId}
      title={props.title}
    >
      <span
        className={cn(
          "block group-hover/title:whitespace-normal group-hover/title:overflow-visible group-focus-visible/title:whitespace-normal group-focus-visible/title:overflow-visible",
          props.className?.includes("line-clamp-2") ? "line-clamp-2" : "truncate",
        )}
      >
        {props.title}
      </span>
    </Link>
  );
}
