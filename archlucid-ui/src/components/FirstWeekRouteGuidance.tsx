import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  resolveFirstWeekRouteGuidance,
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
  readonly primaryAction: { readonly href: string; readonly label: string };
}) {
  const isHashLink = props.primaryAction.href.startsWith("#");

  return (
    <>
      <p className="m-0 mt-1.5 text-neutral-700 dark:text-neutral-300">{props.bridgeCopy}</p>
      <p className="m-0 mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">{props.operateDeferralNote}</p>
      <div className="mt-2.5">
        {isHashLink ? (
          <Button variant="primary" size="sm" asChild>
            <a href={props.primaryAction.href} className="no-underline">
              {props.primaryAction.label}
            </a>
          </Button>
        ) : (
          <Button variant="primary" size="sm" asChild>
            <Link href={props.primaryAction.href} className="no-underline">
              {props.primaryAction.label}
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * First-session callout: one primary next action, run/review bridge copy, and Operate deferral note.
 * Used on Home, Onboarding, New review, Reviews, and review detail before broad Operate exploration.
 */
export function FirstWeekRouteGuidance(props: FirstWeekRouteGuidanceProps) {
  const config = resolveFirstWeekRouteGuidance(props.variant);

  if (props.variant === "home") {
    return (
      <details
        aria-label="First-week guidance"
        data-testid={`first-week-route-guidance-${props.variant}`}
        className="max-w-prose rounded-md border border-neutral-200/90 bg-neutral-50/80 px-3 py-2.5 text-sm leading-snug text-neutral-800 dark:border-neutral-700/80 dark:bg-neutral-900/40 dark:text-neutral-200"
      >
        <summary className="cursor-pointer font-semibold text-neutral-800 dark:text-neutral-100">
          {FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY}
        </summary>
        <p className="m-0 mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">{config.useWhen}</p>
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
      className="max-w-prose rounded-md border border-teal-200/90 bg-teal-50/60 px-3 py-2.5 text-sm leading-snug text-neutral-800 dark:border-teal-900/70 dark:bg-teal-950/25 dark:text-neutral-200"
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
