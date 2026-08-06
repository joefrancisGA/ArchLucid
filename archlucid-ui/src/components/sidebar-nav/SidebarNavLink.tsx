"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { stampRouteReferrer } from "@/lib/operator-navigation-referrer";
import { trackNavLinkClick } from "@/lib/operator-navigation-telemetry";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { pilotNavLinkTestId } from "@/lib/pilot-nav-link-test-ids";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { SIDEBAR_DAILY_HREFS_BY_GROUP } from "@/lib/sidebar-nav-daily-links";

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

export function SidebarNavLink(props: SidebarNavLinkProps): ReactElement {
  const { presented } = props;
  const Icon = presented.icon;
  const onboardingAnchor = onboardingTourAnchorForHref(presented.href);
  const pilotNavTestId = pilotNavLinkTestId(presented.href);

  return (
    <Link
      href={presented.href}
      {...(onboardingAnchor !== undefined ? { "data-onboarding": onboardingAnchor } : {})}
      {...(pilotNavTestId !== undefined ? { "data-testid": pilotNavTestId } : {})}
      className={cn(
        "shell-nav-link flex min-w-0 items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.navLabel,
        props.active
          ? cn("pl-1.5", DESIGN_TOKENS.interactive.navActive)
          : "border-l-2 border-l-transparent pl-1.5 text-neutral-900 dark:text-neutral-100",
      )}
      title={
        props.advancedDemo
          ? `${presented.title} (Advanced — optional)`
          : presented.title
      }
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
      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
      <span className="min-w-0 truncate">{presented.label}</span>
      {presented.navBadge ? (
        <Badge variant="outline" className={cn("ml-auto shrink-0", OPERATOR_TYPOGRAPHY.badge)}>
          {presented.navBadge}
        </Badge>
      ) : null}
      {props.afterLabel}
    </Link>
  );
}

/** @deprecated Prefer {@link SIDEBAR_DAILY_HREFS_BY_GROUP}; retained for older imports. */
export const SIDEBAR_GOVERNANCE_PINNED_HREFS = new Set<string>(
  SIDEBAR_DAILY_HREFS_BY_GROUP["operate-governance"] ?? [],
);
