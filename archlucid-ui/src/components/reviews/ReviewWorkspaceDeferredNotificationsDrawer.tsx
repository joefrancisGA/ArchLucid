import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReviewWorkspaceDeferredNotificationLine = {
  readonly id: string;
  readonly text: string;
};

type ReviewWorkspaceDeferredNotificationsDrawerProps = {
  readonly lines: readonly ReviewWorkspaceDeferredNotificationLine[];
};

export function ReviewWorkspaceDeferredNotificationsDrawer(
  props: ReviewWorkspaceDeferredNotificationsDrawerProps,
): React.JSX.Element | null {
  if (props.lines.length === 0) return null;

  return (
    <details className="mt-2 rounded border border-neutral-200 p-2 dark:border-neutral-800" data-testid="review-workspace-deferred-notifications-drawer">
      <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.helper)}>
        Notifications ({props.lines.length})
      </summary>
      <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
        {props.lines.map((line) => (
          <li key={line.id} className={OPERATOR_TYPOGRAPHY.helper}>
            {line.text}
          </li>
        ))}
      </ul>
    </details>
  );
}
