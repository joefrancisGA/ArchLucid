"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { useTeachingChromeVisible } from "@/lib/workspace-mode/use-teaching-chrome-visible";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { corePilotHelpStepForPath } from "@/lib/core-pilot-help-step-for-path";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { getDocHref } from "@/lib/help/help-topics";
import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  allShortcutRowsForSearch,
  filterGuidesForPath,
  filterShortcutRowsForQuery,
  filterTroubleshootingTopics,
  helpTopicsForGuidesTab,
  helpTopicsForTroubleshootingTab,
} from "./help-panel-topic-filter";
import {
  helpPanelOverlayHrefFromSearch,
  parseHelpPanelQueryFromSearch,
  parseHelpPanelTabFromSearch,
} from "@/lib/help/help-panel-overlay-url";

export type HelpTabId = "guides" | "shortcuts" | "troubleshooting";

export type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When the panel opens, select this tab (defaults to Guides). */
  initialTab?: HelpTabId;
};

const HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY = "archlucid_help_core_pilot_pin_dismissed_session";

export function useHelpPanel({ open, onOpenChange, initialTab = "guides" }: HelpPanelProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const teachingChromeVisible = useTeachingChromeVisible();
  const urlHelpQuery = parseHelpPanelQueryFromSearch(searchParams.get("helpQ"));
  const urlHelpTab = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));
  const [query, setQueryState] = useState(urlHelpQuery);
  const [tab, setTabState] = useState<HelpTabId>(urlHelpTab ?? initialTab);
  const [corePilotPinDismissedThisSession, setCorePilotPinDismissedThisSession] = useState(false);

  const syncHelpPanelOverlayToUrl = useCallback(
    (patch: { tab?: HelpTabId; query?: string; open?: boolean }) => {
      router.replace(
        helpPanelOverlayHrefFromSearch(searchParams.toString(), {
          open: patch.open ?? open,
          tab: patch.tab ?? tab,
          query: patch.query ?? query,
        }, pathname),
        { scroll: false },
      );
    },
    [open, pathname, query, router, searchParams, tab],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      syncHelpPanelOverlayToUrl({ query: value });
    },
    [syncHelpPanelOverlayToUrl],
  );

  const setTab = useCallback(
    (value: HelpTabId) => {
      setTabState(value);
      syncHelpPanelOverlayToUrl({ tab: value });
    },
    [syncHelpPanelOverlayToUrl],
  );

  useEffect(() => {
    if (open) {
      setTabState(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    setQueryState(parseHelpPanelQueryFromSearch(searchParams.get("helpQ")));

    const fromUrl = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));

    if (fromUrl !== null) {
      setTabState(fromUrl);
    }
  }, [searchParams]);

  useLayoutEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      if (sessionStorage.getItem(HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY) === "1") {
        setCorePilotPinDismissedThisSession(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const dismissCorePilotPinForSession = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(HELP_CORE_PILOT_PIN_DISMISSED_SESSION_KEY, "1");
      }
    } catch {
      /* private mode */
    }

    setCorePilotPinDismissedThisSession(true);
  }, []);

  const allShortcutRows = useMemo(() => allShortcutRowsForSearch(), []);

  const guidesBase = useMemo(() => helpTopicsForGuidesTab(), []);
  const troubleshootingBase = useMemo(() => helpTopicsForTroubleshootingTab(), []);

  const guidesFiltered = useMemo(
    () => filterGuidesForPath(guidesBase, pathname, query),
    [guidesBase, pathname, query],
  );

  const troubleshootingFiltered = useMemo(
    () => filterTroubleshootingTopics(troubleshootingBase, query),
    [query, troubleshootingBase],
  );

  const shortcutsSearchHits = useMemo(
    () => filterShortcutRowsForQuery(allShortcutRows, query),
    [allShortcutRows, query],
  );

  const corePilotPinnedHelp = useMemo(() => {
    if (!teachingChromeVisible || hasCommittedArchitectureReview || corePilotPinDismissedThisSession) {
      return null;
    }

    if (query.trim().length > 0) {
      return null;
    }

    const pilotCtx = corePilotHelpStepForPath(pathname);

    if (pilotCtx === null) {
      return null;
    }

    const corePilotGuideHref = getDocHref("docs/CORE_PILOT.md");

    return (
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800">
        <h3 className={cn("m-0 font-semibold text-al-text-primary dark:text-neutral-100", OPERATOR_NAV_GROUP_LABEL)}>
          {FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE} — suggested next step
        </h3>
        <p className={cn("m-0 mt-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Step {pilotCtx.stepIndex + 1} of {CORE_PILOT_STEPS.length}: {pilotCtx.step.title}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{pilotCtx.step.shortBody}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="primary">
              <Link href={pilotCtx.step.primaryHref} onClick={() => onOpenChange(false)}>
                {pilotCtx.step.primaryLabel}
              </Link>
            </Button>
            {corePilotGuideHref ? (
              <Button asChild size="sm" variant="outline">
                <Link href={corePilotGuideHref} onClick={() => onOpenChange(false)}>
                  {FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
                </Link>
              </Button>
            ) : null}
          </div>
          <DismissControl
            className={cn(
              "h-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
              OPERATOR_TYPOGRAPHY.button,
            )}
            label="Dismiss for this session"
            onDismiss={dismissCorePilotPinForSession}
          />
        </div>
      </div>
    );
  }, [
    corePilotPinDismissedThisSession,
    dismissCorePilotPinForSession,
    hasCommittedArchitectureReview,
    onOpenChange,
    pathname,
    query,
    teachingChromeVisible,
  ]);

  const handleOpenChange = useCallback((next: boolean): void => {
    if (!next) {
      setQueryState("");
      setTabState("guides");
      syncHelpPanelOverlayToUrl({ open: false, tab: "guides", query: "" });
    }

    onOpenChange(next);
  }, [onOpenChange, syncHelpPanelOverlayToUrl]);

  return {
    query,
    setQuery,
    tab,
    setTab,
    guidesFiltered,
    troubleshootingFiltered,
    shortcutsSearchHits,
    corePilotPinnedHelp,
    handleOpenChange,
    onOpenChange,
  };
}

export type UseHelpPanelResult = ReturnType<typeof useHelpPanel>;
