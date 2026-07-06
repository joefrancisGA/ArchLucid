"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { pilotNavLinkTestId } from "@/lib/pilot-nav-link-test-ids";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { navLinkQuestionSubtitle } from "@/lib/usability/nav-link-question-subtitles";

type SidebarNavLinkLabelProps = {
  readonly presented: NavLinkItem;
  readonly showQuestionSubtitle?: boolean;
};

export function SidebarNavLinkLabel(props: SidebarNavLinkLabelProps): ReactElement {
  const subtitle =
    props.showQuestionSubtitle === false ? null : navLinkQuestionSubtitle(props.presented.href);

  if (subtitle === null) {
    return <>{props.presented.label}</>;
  }

  return (
    <span className="flex min-w-0 flex-col">
      <span>{props.presented.label}</span>
      <span
        aria-hidden="true"
        className={OPERATOR_TYPOGRAPHY.navHelper}
      >
        {subtitle}
      </span>
    </span>
  );
}

type SidebarNavLinkProps = {
  readonly presented: NavLinkItem;
  readonly active: boolean;
  readonly advancedDemo: boolean;
  readonly buyerPolishedShell: boolean;
  readonly showQuestionSubtitle?: boolean;
  readonly afterLabel?: ReactNode;
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
        "shell-nav-link flex min-w-0 items-center gap-2 rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.navLabel,
        props.active
          ? DESIGN_TOKENS.interactive.navActive
          : "text-neutral-900 dark:text-neutral-100",
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
        props.onNavigate?.();
      }}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
      <SidebarNavLinkLabel presented={presented} showQuestionSubtitle={props.showQuestionSubtitle} />
      {props.afterLabel}
    </Link>
  );
}

/** Hrefs pinned above the Governance body when they exist on `operate-governance` links in `nav-config`. */
export const SIDEBAR_GOVERNANCE_PINNED_HREFS = new Set<string>([]);
