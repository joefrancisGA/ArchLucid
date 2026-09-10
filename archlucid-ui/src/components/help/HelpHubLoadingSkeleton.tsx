import { HELP_HUB_LOADING_STATUS } from "@/lib/help/help-hub-loading-copy";

/** Loading placeholder while the Help Center hub client chunk resolves (HEL). */
export function HelpHubLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="help-hub-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={HELP_HUB_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{HELP_HUB_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
