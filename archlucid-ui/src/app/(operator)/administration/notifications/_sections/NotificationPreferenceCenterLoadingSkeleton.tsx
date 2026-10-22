import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { NOTIFICATION_PREFERENCE_CENTER_LOADING_STATUS } from "./notification-preference-center-page-copy";
import { cn } from "@/lib/utils";

/** Loading placeholder while notification channel status hydrates (ADN). */
export function NotificationPreferenceCenterLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      data-testid="notification-preference-center-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={NOTIFICATION_PREFERENCE_CENTER_LOADING_STATUS}
    >
      <p className={cn("m-0 text-al-text-secondary md:col-span-2", OPERATOR_TYPOGRAPHY.body)}>
        {NOTIFICATION_PREFERENCE_CENTER_LOADING_STATUS}
      </p>
      <div className="h-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
