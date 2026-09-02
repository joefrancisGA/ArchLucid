"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { HelpTabId } from "@/components/HelpPanel";
import {
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance/governance-route-paths";
import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";

export function useAppShellState() {
  const pathname = usePathname();
  const router = useRouter();
  const [helpGuidesOpen, setHelpGuidesOpen] = useState(false);
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>("guides");
  const [helpDocSearchOpen, setHelpDocSearchOpen] = useState(false);

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
    setHelpGuidesOpen(true);
  }, []);

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
