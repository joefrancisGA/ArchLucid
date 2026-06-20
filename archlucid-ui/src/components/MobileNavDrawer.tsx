"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OperateCapabilityNavGroupHint } from "@/components/OperateCapabilityHints";
import { OperatorAdvancedModeToggle } from "@/components/OperatorAdvancedModeToggle";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import { isNavLinkActive } from "@/lib/nav-link-active";
import {
  listNavGroupsVisibleInOperatorShell,
  type NavGroupWithVisibleLinks,
} from "@/lib/nav-shell-visibility";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { shouldHideOperatorNavLinkInDemo } from "@/lib/route-readiness";
import { resolveNavLinkPresentation } from "@/lib/operator-nav-labels";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { filterNavLinksByOperateUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { operateNavUnlockPhaseForAdvancedFeatures } from "@/lib/usability/operate-advanced-features-disclosure";
import { cn } from "@/lib/utils";

function renderMobileNavBlock(
  rows: NavGroupWithVisibleLinks[],
  pathname: string,
  demoUi: boolean,
  buyerPolishedShell: boolean,
  hasCommittedArchitectureReview: boolean,
  advancedFeaturesEnabled: boolean,
  close: () => void,
): ReactElement[] {
  const operateUnlockPhase = operateNavUnlockPhaseForAdvancedFeatures(advancedFeaturesEnabled);

  return rows.map(({ group, visibleLinks }) => {
    const linksAfterDemo = demoUi
      ? visibleLinks.filter((l) => !shouldHideOperatorNavLinkInDemo(l.href, demoUi))
      : visibleLinks;
    const linksForRender = filterNavLinksByOperateUnlockPhase(
      linksAfterDemo,
      hasCommittedArchitectureReview,
      operateUnlockPhase,
    );

    if (linksForRender.length === 0) {
      return <div key={group.id} />;
    }

    return (
      <div key={group.id}>
        <div className="mb-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
            {group.label}
          </h3>
          {group.caption ? (
            <span className="mt-0.5 block text-[10px] font-normal normal-case leading-snug tracking-normal text-neutral-700 dark:text-neutral-300">
              {group.caption}
            </span>
          ) : null}
          {group.id === "operate-governance" ? <OperateCapabilityNavGroupHint /> : null}
        </div>
        <nav className="flex flex-col gap-0.5" aria-label={group.label}>
          {linksForRender.map((link) => {
            const presented = resolveNavLinkPresentation(link, buyerPolishedShell);
            const active = isNavLinkActive(pathname, presented.href);
            const Icon = link.icon;

            return (
              <Link
                key={presented.href}
                href={presented.href}
                data-onboarding={onboardingTourAnchorForHref(presented.href)}
                className={cn(
                  "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  active
                    ? "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] font-semibold text-al-text-primary dark:bg-neutral-800/80"
                    : "text-neutral-900 dark:text-neutral-100",
                )}
                title={presented.title}
                aria-current={active ? "page" : undefined}
                aria-keyshortcuts={link.keyShortcut ? registryKeyToAriaKeyShortcuts(link.keyShortcut) : undefined}
                onClick={() => {
                  close();
                }}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                {presented.label}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  });
}

/**
 * Hamburger + full-height drawer for small screens (sidebar is hidden below `lg`).
 */
export function MobileNavDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { showExtended, showAdvanced, setOperatorAdvancedMode } = useNavProgressiveDisclosure();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } = effectiveNavDisclosureForPathname(
    pathname,
    showExtended,
    showAdvanced,
  );

  const extendedForShell = isCtoDemoNavExpandedEnv() ? true : buyerPolishedShell ? false : demoUi ? true : shellShowExtended;
  const advancedForShell = isCtoDemoNavExpandedEnv() ? true : buyerPolishedShell ? false : demoUi ? true : shellShowAdvanced;
  const operatorAdvancedModeOn = showExtended && showAdvanced;
  const operateNavUnlockPhase = operateNavUnlockPhaseForAdvancedFeatures(operatorAdvancedModeOn);

  function toggleOperatorAdvancedMode(): void {
    setOperatorAdvancedMode(!operatorAdvancedModeOn);
  }

  const reviewNavRows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    extendedForShell,
    advancedForShell,
    callerAuthorityRank,
    false,
    "review-workflow",
    hasCommittedArchitectureReview,
    operateNavUnlockPhase,
  );

  const omitAdminClusters = demoUi || buyerPolishedShell;

  const adminNavRows = omitAdminClusters
    ? ([] as NavGroupWithVisibleLinks[])
    : listNavGroupsVisibleInOperatorShell(
        NAV_GROUPS,
        extendedForShell,
        advancedForShell,
        callerAuthorityRank,
        false,
        "platform-admin",
        hasCommittedArchitectureReview,
        operateNavUnlockPhase,
      );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!left-0 !top-0 flex h-full max-h-screen w-[min(100vw,20rem)] max-w-[min(100vw,20rem)] !translate-x-0 !translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 border-r border-neutral-200 p-0 shadow-xl data-[state=closed]:!slide-out-to-left-0 data-[state=open]:!slide-in-from-left-0 dark:border-neutral-700 sm:max-w-[20rem]">
          <DialogHeader className="border-b border-neutral-200 px-4 py-3 text-left dark:border-neutral-700">
            <DialogTitle className="text-base">Operator navigation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-3 py-3">
            {demoUi || buyerPolishedShell ? null : (
              <OperatorAdvancedModeToggle
                advancedModeOn={operatorAdvancedModeOn}
                onToggle={toggleOperatorAdvancedMode}
                testId="mobile-operator-advanced-mode-toggle"
              />
            )}
            {renderMobileNavBlock(reviewNavRows, pathname, demoUi, buyerPolishedShell, hasCommittedArchitectureReview, operatorAdvancedModeOn, () => {
              setOpen(false);
            })}
            {adminNavRows.length > 0 ? (
              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
                  Administration
                </h3>
                {renderMobileNavBlock(adminNavRows, pathname, demoUi, buyerPolishedShell, hasCommittedArchitectureReview, operatorAdvancedModeOn, () => {
                  setOpen(false);
                })}
              </div>
            ) : null}
            {buyerPolishedShell ? null : (
              <p className="text-xs text-neutral-700 dark:text-neutral-300" aria-keyshortcuts="Shift+?">
                Press Shift+/ for documentation search; open Guides from the panel for shortcuts
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
