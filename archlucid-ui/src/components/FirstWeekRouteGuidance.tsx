import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveFirstWeekRouteGuidanceForShell,
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY,
  type FirstWeekRouteGuidanceVariant,
} from "@/lib/first-week-route-guidance";

export type FirstWeekRouteGuidanceProps = {
  readonly variant: FirstWeekRouteGuidanceVariant;
};

function GuidanceBody(props: {
  readonly useWhen: string;
  readonly bridgeCopy: string;
  readonly operateDeferralNote: string;
  readonly primaryAction?: { readonly href: string; readonly label: string };
}) {
  const primaryAction = props.primaryAction;

  return (
    <>
      <p className="m-0 mt-1.5 text-neutral-700 dark:text-neutral-300">{props.bridgeCopy}</p>
      {props.operateDeferralNote.trim().length > 0 ? (
        <p className={cn("m-0 mt-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.operateDeferralNote}</p>
      ) : null}
      {primaryAction !== undefined ? (
        <div className="mt-2.5">
          {primaryAction.href.startsWith("#") ? (
            <Button variant="primary" size="sm" asChild>
              <a href={primaryAction.href} className="no-underline">
                {primaryAction.label}
              </a>
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link href={primaryAction.href} className="no-underline">
                {primaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
}

/**
 * First-session callout: one primary next action, run/review bridge copy, and Operate deferral note.
 * Used on Home, Onboarding, New review, Reviews, and review detail before broad Operate exploration.
 */
export function FirstWeekRouteGuidance(props: FirstWeekRouteGuidanceProps) {
  const config = resolveFirstWeekRouteGuidanceForShell(props.variant, isBuyerPolishedOperatorShellEnv());

  if (props.variant === "onboarding") {
    return (
      <aside
        aria-label="First-week guidance"
        data-testid={`first-week-route-guidance-${props.variant}`}
        className={cn("rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 max-w-prose px-3 py-2.5 leading-snug", OPERATOR_TYPOGRAPHY.body)}
      >
        <p className="m-0 font-semibold text-teal-900 dark:text-teal-200">{config.useWhen}</p>
        <GuidanceBody
          useWhen={config.useWhen}
          bridgeCopy={config.bridgeCopy}
          operateDeferralNote={config.operateDeferralNote}
          primaryAction={config.primaryAction}
        />
      </aside>
    );
  }

  if (props.variant === "home") {
    return (
      <details
        aria-label="First-week guidance"
        data-testid={`first-week-route-guidance-${props.variant}`}
        className={cn("max-w-prose rounded-md border border-neutral-200/90 bg-neutral-50/80 px-3 py-2.5 leading-snug text-neutral-800 dark:border-neutral-700/80 dark:bg-neutral-900/40 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      >
        <summary className="cursor-pointer font-semibold text-neutral-800 dark:text-neutral-100">
          {FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY}
        </summary>
        <p className={cn("m-0 mt-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{config.useWhen}</p>
        <GuidanceBody
          useWhen={config.useWhen}
          bridgeCopy={config.bridgeCopy}
          operateDeferralNote={config.operateDeferralNote}
          primaryAction={config.primaryAction}
        />
      </details>
    );
  }

  return (
    <aside
      aria-label="First-week guidance"
      data-testid={`first-week-route-guidance-${props.variant}`}
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 max-w-prose px-3 py-2.5 leading-snug", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0">
        <span className="font-semibold text-teal-900 dark:text-teal-200">Use this when:</span> {config.useWhen}
      </p>
      <GuidanceBody
        useWhen={config.useWhen}
        bridgeCopy={config.bridgeCopy}
        operateDeferralNote={config.operateDeferralNote}
        primaryAction={config.primaryAction}
      />
    </aside>
  );
}
