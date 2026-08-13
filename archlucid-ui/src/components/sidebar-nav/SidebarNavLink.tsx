"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { stampRouteReferrer } from "@/lib/operator/operator-navigation-referrer";
import { trackNavLinkClick } from "@/lib/operator/operator-navigation-telemetry";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { pilotNavLinkTestId } from "@/lib/pilot-nav-link-test-ids";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { SIDEBAR_DAILY_HREFS_BY_GROUP } from "@/lib/sidebar-nav-daily-links";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** High-traffic hubs — explicit prefetch for faster soft-nav (default is already on; pin intent). */
const HIGH_TRAFFIC_HUB_HREFS: ReadonlySet<string> = new Set([
  "/",
  "/architecture/reviews",
  "/architecture/reviews/new",
  "/governance/approval-queue",
  "/governance/findings",
  "/governance/alerts",
  "/governance/alert-rules",
  "/governance/policy-packs",
  SIGNED_RECORDS_LIST_PATH,
  "/architecture/executive-dashboard",
]);

type SidebarNavLinkProps = {
  readonly presented: NavLinkItem;
  readonly active: boolean;
  readonly advancedDemo: boolean;
  readonly buyerPolishedShell: boolean;
  readonly afterLabel?: ReactNode;
  readonly navGroupId?: string;
  readonly unlockPhase?: OperateNavUnlockPhase;
  readonly onNavigate?: () => void;
};

function sidebarNavLinkHintId(href: string): string {
  return `sidebar-nav-link-hint-${href.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

function sidebarNavLinkSupplementalHint(presented: NavLinkItem, advancedDemo: boolean): string | null {
  if (presented.navLinkDisabled === true) {
    return presented.navLinkDisabledTitle ?? presented.title;
  }

  const hint = advancedDemo ? `${presented.title} (Advanced — optional)` : presented.title;

  if (hint.trim() === presented.label.trim()) {
    return null;
  }

  return hint;
}

export function SidebarNavLink(props: SidebarNavLinkProps): ReactElement {
  const { presented } = props;
  const supplementalHint = sidebarNavLinkSupplementalHint(presented, props.advancedDemo);
  const hintId = supplementalHint === null ? undefined : sidebarNavLinkHintId(presented.href);
  const Icon = presented.icon;
  const onboardingAnchor = onboardingTourAnchorForHref(presented.href);
  const pilotNavTestId = pilotNavLinkTestId(presented.href);
  const sharedClassName = cn(
    "shell-nav-link flex min-w-0 items-center gap-2 rounded-md py-1.5 pr-2",
    OPERATOR_TYPOGRAPHY.navLabel,
    props.active
      ? cn("pl-1.5", DESIGN_TOKENS.interactive.navActive)
      : "border-l-2 border-l-transparent pl-1.5 text-neutral-900 dark:text-neutral-100",
  );
  const labelContent = (
    <>
      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
      <span className="min-w-0 truncate">{presented.label}</span>
      {presented.navBadge ? (
        <Badge variant="outline" className={cn("ml-auto shrink-0", OPERATOR_TYPOGRAPHY.badge)}>
          {presented.navBadge}
        </Badge>
      ) : null}
      {props.afterLabel}
    </>
  );

  if (presented.navLinkDisabled === true) {
    return (
      <>
        <span
          {...(pilotNavTestId !== undefined ? { "data-testid": pilotNavTestId } : {})}
          className={cn(sharedClassName, "cursor-not-allowed text-neutral-500 dark:text-neutral-400")}
          aria-disabled="true"
          aria-describedby={hintId}
        >
          {labelContent}
        </span>
        {supplementalHint ? (
          <span id={hintId} className="sr-only">
            {supplementalHint}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Link
        href={presented.href}
        prefetch={HIGH_TRAFFIC_HUB_HREFS.has(presented.href) ? true : undefined}
        {...(onboardingAnchor !== undefined ? { "data-onboarding": onboardingAnchor } : {})}
        {...(pilotNavTestId !== undefined ? { "data-testid": pilotNavTestId } : {})}
        className={cn(sharedClassName, "hover:bg-neutral-100 dark:hover:bg-neutral-800")}
        aria-describedby={hintId}
        aria-current={props.active ? "page" : undefined}
      aria-keyshortcuts={
        presented.keyShortcut ? registryKeyToAriaKeyShortcuts(presented.keyShortcut) : undefined
      }
      onClick={() => {
        if (props.navGroupId !== undefined && props.unlockPhase !== undefined) {
          trackNavLinkClick({
            href: presented.href,
            group: props.navGroupId,
            tier: presented.tier,
            unlockPhase: props.unlockPhase,
          });
          stampRouteReferrer("nav");
        }

        props.onNavigate?.();
      }}
      >
        {labelContent}
      </Link>
      {supplementalHint ? (
        <span id={hintId} className="sr-only">
          {supplementalHint}
        </span>
      ) : null}
    </>
  );
}

/** @deprecated Prefer {@link SIDEBAR_DAILY_HREFS_BY_GROUP}; retained for older imports. */
export const SIDEBAR_GOVERNANCE_PINNED_HREFS = new Set<string>(
  SIDEBAR_DAILY_HREFS_BY_GROUP["operate-governance"] ?? [],
);
