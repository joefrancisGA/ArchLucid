"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { InlineGuidance } from "@/components/InlineGuidance";
import { Button } from "@/components/ui/button";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import {
  resolveFirstWeekRouteGuidanceForShell,
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY,
  FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY,
  FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED_COLLAPSED_SUMMARY,
  type FirstWeekRouteGuidanceVariant,
} from "@/lib/first-week-route-guidance";
import { useInviteeReviewerContext } from "@/hooks/use-invitee-reviewer-context";

export type FirstWeekRouteGuidanceProps = {
  readonly variant: FirstWeekRouteGuidanceVariant;
  /** When another surface owns the page primary, demote guidance CTAs to outline. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function GuidanceBody(props: {
  readonly useWhen: string;
  readonly bridgeCopy: string;
  readonly operateDeferralNote: string;
  readonly primaryAction?: { readonly href: string; readonly label: string };
  readonly pagePrimaryOwnedElsewhere?: boolean;
}) {
  const primaryAction = props.primaryAction;
  const primaryButtonVariant =
    props.pagePrimaryOwnedElsewhere === true && primaryAction !== undefined ? "outline" : "primary";

  return (
    <>
      <p className="m-0 mt-1.5 text-neutral-700 dark:text-neutral-300">{props.bridgeCopy}</p>
      {props.operateDeferralNote.trim().length > 0 ? (
        <p className={cn("m-0 mt-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.operateDeferralNote}</p>
      ) : null}
      {primaryAction !== undefined ? (
        <div className="mt-2.5">
          {primaryAction.href.startsWith("#") ? (
            // Same-page jump to an already-rendered section — link affordance, not a primary button
            // (see .cursor/rules/UI-Accessibility-Baseline.mdc: same-page jump = link).
            <a href={primaryAction.href} className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
              {primaryAction.label}
            </a>
          ) : (
            <Button variant={primaryButtonVariant} size="sm" asChild>
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
  const { isInviteeReviewer } = useInviteeReviewerContext();
  const pagePrimaryOwnedElsewhere = props.pagePrimaryOwnedElsewhere === true;

  if (isInviteeReviewer) {
    return null;
  }

  const config = resolveFirstWeekRouteGuidanceForShell(props.variant, isBuyerPolishedOperatorShellEnv());

  if (props.variant === "onboarding") {
    return (
      <aside
        aria-label="First-week guidance"
        data-testid={`first-week-route-guidance-${props.variant}`}
        className={cn("rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3 py-2.5 leading-snug", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}
      >
        <p className="m-0 font-semibold text-al-text-primary dark:text-neutral-100">{config.useWhen}</p>
        <GuidanceBody
          useWhen={config.useWhen}
          bridgeCopy={config.bridgeCopy}
          operateDeferralNote={config.operateDeferralNote}
          primaryAction={config.primaryAction}
          pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
        />
      </aside>
    );
  }

  if (props.variant === "home") {
    return (
      <OperatorHomeDisclosureSection
        title={FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY}
        titleId="first-week-guidance-home"
        sectionTestId="first-week-route-guidance-home"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance}
        defaultExpanded={false}
        collapsedSummary={FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY}
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{config.useWhen}</p>
        <GuidanceBody
          useWhen={config.useWhen}
          bridgeCopy={config.bridgeCopy}
          operateDeferralNote={config.operateDeferralNote}
          primaryAction={config.primaryAction}
          pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
        />
      </OperatorHomeDisclosureSection>
    );
  }

  if (props.variant === "review-detail-committed") {
    return (
      <OperatorHomeDisclosureSection
        title="Review guidance"
        titleId="first-week-guidance-review-detail-committed"
        sectionTestId="first-week-route-guidance-review-detail-committed"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance}
        defaultExpanded={false}
        collapsedSummary={FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED_COLLAPSED_SUMMARY}
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{config.useWhen}</p>
        <GuidanceBody
          useWhen={config.useWhen}
          bridgeCopy={config.bridgeCopy}
          operateDeferralNote={config.operateDeferralNote}
          primaryAction={config.primaryAction}
          pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
        />
      </OperatorHomeDisclosureSection>
    );
  }

  return (
    <aside
      aria-label="First-week guidance"
      data-testid={`first-week-route-guidance-${props.variant}`}
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3 py-2.5 leading-snug", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0">
        <InlineGuidance label="Use this when:" labelTestId="inline-guidance-use-this-when">
          {config.useWhen}
        </InlineGuidance>
      </p>
      <GuidanceBody
        useWhen={config.useWhen}
        bridgeCopy={config.bridgeCopy}
        operateDeferralNote={config.operateDeferralNote}
        primaryAction={config.primaryAction}
        pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
      />
    </aside>
  );
}
