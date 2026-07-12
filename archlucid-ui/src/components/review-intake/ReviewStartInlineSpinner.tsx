import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ReviewStartInlineSpinnerProps = {
  readonly className?: string;
  readonly label?: string;
};

/** Accessible inline spinner for review-start actions. */
export function ReviewStartInlineSpinner(props: ReviewStartInlineSpinnerProps): React.ReactElement {
  return (
    <Loader2
      className={cn("h-4 w-4 shrink-0 animate-spin", props.className)}
      aria-hidden={props.label === undefined}
      aria-label={props.label}
      role={props.label !== undefined ? "status" : undefined}
    />
  );
}
