"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { usePathname, useRouter } from "next/navigation";

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
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

function readCommittedSearchParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export function useAppShellState() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { isWorkingMode } = useWorkspaceMode();
  const [helpGuidesOpen, setHelpGuidesOpenState] = useState(() =>
    parseHelpPanelOpenFromSearch(readCommittedSearchParams().get("help")),
  );
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>(() =>
    parseHelpPanelTabFromSearch(readCommittedSearchParams().get("helpTab")) ?? "guides",
  );
  const [helpDocSearchOpen, setHelpDocSearchOpenState] = useState(() =>
    parseHelpDocSearchOpenFromSearch(readCommittedSearchParams().get("helpSearchOpen")),
  );
  const helpDocSearchOpenRef = useRef(helpDocSearchOpen);
  helpDocSearchOpenRef.current = helpDocSearchOpen;

  const syncHelpPanelOpenToUrl = useCallback(
    (open: boolean, tab: HelpTabId = helpGuidesInitialTab) => {
      commitHrefIfChanged(
        helpPanelOverlayHrefFromSearch(readCommittedSearchParams().toString(), { open, tab, query: "" }, pathname),
        { notify: false },
      );
    },
    [helpGuidesInitialTab, pathname],
  );

  const syncHelpDocSearchOpenToUrl = useCallback(
    (open: boolean, query: string = "") => {
      commitHrefIfChanged(
        helpDocSearchPanelHrefFromSearch(readCommittedSearchParams().toString(), { open, query }, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setHelpGuidesOpen = useCallback(
    (open: boolean) => {
      if (helpGuidesOpen === open) {
        return;
      }

      setHelpGuidesOpenState(open);
      syncHelpPanelOpenToUrl(open);
    },
    [helpGuidesOpen, syncHelpPanelOpenToUrl],
  );

  const setHelpDocSearchOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(helpDocSearchOpenRef.current) : value;
      setHelpDocSearchOpenState(next);
      syncHelpDocSearchOpenToUrl(next, next ? "" : "");
    },
    [syncHelpDocSearchOpenToUrl],
  );

  useEffect(() => {
    const syncHelpPanelFromUrl = (): void => {
      const params = readCommittedSearchParams();
      const open = parseHelpPanelOpenFromSearch(params.get("help"));
      const tab = parseHelpPanelTabFromSearch(params.get("helpTab"));

      setHelpGuidesOpenState(open);

      if (tab !== null) {
        setHelpGuidesInitialTab(tab);
      }

      setHelpDocSearchOpenState(parseHelpDocSearchOpenFromSearch(params.get("helpSearchOpen")));
    };

    syncHelpPanelFromUrl();
    window.addEventListener("popstate", syncHelpPanelFromUrl);

    return () => {
      window.removeEventListener("popstate", syncHelpPanelFromUrl);
    };
  }, []);

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
    commitHrefIfChanged(
      helpPanelOverlayHrefFromSearch(readCommittedSearchParams().toString(), { open: true, tab: initialTab, query: "" }, pathname),
      { notify: false },
    );
  }, [pathname]);

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
