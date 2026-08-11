import { cn } from "@/lib/utils";

export type NewSinceLastVisitMarkerProps = {
  readonly className?: string;
  readonly testId?: string;
};

/** Quiet dot for entities updated since the operator's last visit (TB-2150). */
export function NewSinceLastVisitMarker(props: NewSinceLastVisitMarkerProps): React.JSX.Element {
  return (
    <span
      aria-label="Updated since your last visit"
      data-testid={props.testId ?? "new-since-last-visit-marker"}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full bg-teal-600 align-middle dark:bg-teal-500",
        props.className,
      )}
    />
  );
}
