import { Pin } from "lucide-react";

import { cn } from "@/lib/utils";

type ReviewPinGlyphProps = {
  readonly filled: boolean;
  readonly className?: string;
};

/** Outline pin when unfilled; solid pin when filled — the only pin-state cue. */
export function ReviewPinGlyph(props: ReviewPinGlyphProps): React.JSX.Element {
  return (
    <Pin
      className={cn(props.className ?? "h-4 w-4", props.filled ? "fill-current" : null)}
      aria-hidden
    />
  );
}
