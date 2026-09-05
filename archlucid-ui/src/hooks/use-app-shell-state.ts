"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { HelpTabId } from "@/components/HelpPanel";
import {
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance/governance-route-paths";
import {
  helpPanelOverlayHrefFromSearch,
  parseHelpPanelOpenFromSearch,
  parseHelpPanelTabFromSearch,
} from "@/lib/help/help-panel-overlay-url";
import {
  helpDocSearchPanelHrefFromSearch,
  parseHelpDocSearchOpenFromSearch,
} from "@/lib/help/help-doc-search-panel-url";
import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

export function useAppShellState() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();
  const urlHelpOpen = parseHelpPanelOpenFromSearch(searchParams.get("help"));
  const urlHelpTab = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));
  const helpSearchOpenParam = searchParams.get("helpSearchOpen");
  const [helpGuidesOpen, setHelpGuidesOpenState] = useState(urlHelpOpen);
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>(urlHelpTab ?? "guides");
  const [helpDocSearchOpen, setHelpDocSearchOpenState] = useState(() =>
    parseHelpDocSearchOpenFromSearch(helpSearchOpenParam),
  );

  const syncHelpPanelOpenToUrl = useCallback(
    (open: boolean, tab: HelpTabId = helpGuidesInitialTab) => {
      router.replace(
        helpPanelOverlayHrefFromSearch(searchParams.toString(), { open, tab, query: "" }, pathname),
        { scroll: false },
      );
    },
    [helpGuidesInitialTab, pathname, router, searchParams],
  );

  const syncHelpDocSearchOpenToUrl = useCallback(
    (open: boolean, query: string = "") => {
      router.replace(
        helpDocSearchPanelHrefFromSearch(searchParams.toString(), { open, query }, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setHelpGuidesOpen = useCallback(
    (open: boolean) => {
      setHelpGuidesOpenState(open);
      syncHelpPanelOpenToUrl(open);
    },
    [syncHelpPanelOpenToUrl],
  );

  const setHelpDocSearchOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setHelpDocSearchOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncHelpDocSearchOpenToUrl(next, next ? "" : "");

        return next;
      });
    },
    [syncHelpDocSearchOpenToUrl],
  );

  useEffect(() => {
    const open = parseHelpPanelOpenFromSearch(searchParams.get("help"));
    const tab = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));

    setHelpGuidesOpenState(open);

    if (tab !== null) {
      setHelpGuidesInitialTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setHelpDocSearchOpenState(parseHelpDocSearchOpenFromSearch(helpSearchOpenParam));
  }, [helpSearchOpenParam]);

  const openHelpSearch = useCallback(() => {
    const request = resolveOperatorHelpRequestForPathname(pathname ?? "/", { workingMode: isWorkingMode });

    if (request.kind === "navigate") {
      router.push(request.href);
      return;
    }

    setHelpDocSearchOpenState(true);
    syncHelpDocSearchOpenToUrl(true);
  }, [isWorkingMode, pathname, router, syncHelpDocSearchOpenToUrl]);

  const openHelpGuidesPanel = useCallback((initialTab: HelpTabId = "guides") => {
    setHelpGuidesInitialTab(initialTab);
    setHelpGuidesOpenState(true);
    router.replace(
      helpPanelOverlayHrefFromSearch(searchParams.toString(), { open: true, tab: initialTab, query: "" }, pathname),
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  const hideWorkspaceHealthFooter =
    pathname === "/" ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/insights/evidence-graph") ||
    pathname.startsWith("/insights/ask-review-questions") ||
    pathname.startsWith("/governance") ||
    pathMatchesGovernanceAudit(pathname) ||
    pathMatchesGovernanceAlerts(pathname) ||
    pathMatchesGovernancePolicyPacks(pathname) ||
    (pathname.startsWith("/architecture/reviews/") && pathname.split("/").filter(Boolean).length >= 2);

  const isAuthRoute = pathname.startsWith("/auth/");
  const isAccessDeniedRoute = pathname === "/403";
  const isStandaloneAccessSurface = isAuthRoute || isAccessDeniedRoute;

  return {
    pathname,
    helpGuidesOpen,
    helpGuidesInitialTab,
    helpDocSearchOpen,
    setHelpDocSearchOpen,
    setHelpGuidesOpen,
    openHelpSearch,
    openHelpGuidesPanel,
    hideWorkspaceHealthFooter,
    isAuthRoute,
    isAccessDeniedRoute,
    isStandaloneAccessSurface,
  };
}
