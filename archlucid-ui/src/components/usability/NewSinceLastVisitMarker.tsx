import { cn } from "@/lib/utils";

import { LAST_VISITED_THIS_BROWSER_HONESTY_NOTE } from "@/lib/usability/last-visited-watermark-honesty";

export type NewSinceLastVisitMarkerProps = {
  readonly className?: string;
  readonly testId?: string;
  /** When false, omits the this-browser honesty helper (e.g. account-backed watermarks). */
  readonly showThisBrowserHonesty?: boolean;
};

/** Quiet dot for entities updated since the operator's last visit (TB-2150). */
export function NewSinceLastVisitMarker(props: NewSinceLastVisitMarkerProps): React.JSX.Element {
  const showHonesty = props.showThisBrowserHonesty !== false;

  return (
    <span className={cn("inline-flex items-center gap-1.5", props.className)}>
      <span
        aria-label="Updated since your last visit"
        data-testid={props.testId ?? "new-since-last-visit-marker"}
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-teal-600 align-middle dark:bg-teal-500"
      />
      {showHonesty ? (
        <span
          className="sr-only"
          data-testid="new-since-last-visit-this-browser-honesty"
        >
          {LAST_VISITED_THIS_BROWSER_HONESTY_NOTE}
        </span>
      ) : null}
    </span>
  );
}
