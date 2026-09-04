"use client";

import { useCallback, useEffect, useState } from "react";
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
import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";

export function useAppShellState() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlHelpOpen = parseHelpPanelOpenFromSearch(searchParams.get("help"));
  const urlHelpTab = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));
  const [helpGuidesOpen, setHelpGuidesOpenState] = useState(urlHelpOpen);
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>(urlHelpTab ?? "guides");
  const [helpDocSearchOpen, setHelpDocSearchOpen] = useState(false);

  const syncHelpPanelOpenToUrl = useCallback(
    (open: boolean, tab: HelpTabId = helpGuidesInitialTab) => {
      router.replace(
        helpPanelOverlayHrefFromSearch(searchParams.toString(), { open, tab, query: "" }, pathname),
        { scroll: false },
      );
    },
    [helpGuidesInitialTab, pathname, router, searchParams],
  );

  const setHelpGuidesOpen = useCallback(
    (open: boolean) => {
      setHelpGuidesOpenState(open);
      syncHelpPanelOpenToUrl(open);
    },
    [syncHelpPanelOpenToUrl],
  );

  useEffect(() => {
    const open = parseHelpPanelOpenFromSearch(searchParams.get("help"));
    const tab = parseHelpPanelTabFromSearch(searchParams.get("helpTab"));

    setHelpGuidesOpenState(open);

    if (tab !== null) {
      setHelpGuidesInitialTab(tab);
    }
  }, [searchParams]);

  const openHelpSearch = useCallback(() => {
    const request = resolveOperatorHelpRequestForPathname(pathname ?? "/");

    if (request.kind === "navigate") {
      router.push(request.href);
      return;
    }

    setHelpDocSearchOpen(true);
  }, [pathname, router]);

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
