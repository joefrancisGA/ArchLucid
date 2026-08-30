"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID,
} from "@/lib/sponsor/sponsor-dashboard-route";
import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

function isLegacyWorkspaceHealthHash(hash: string): boolean {
  return hash === `#${SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}`;
}

function legacyWorkspaceHealthRedirectTarget(): string {
  return `${WORKSPACE_HEALTH_PATH}${window.location.search}`;
}

/** Sends legacy `#workspace-health` sponsor-dashboard bookmarks to the standalone page. */
export function SponsorDashboardLegacyWorkspaceHealthHashRedirect(): null {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const redirectIfLegacyHash = (): void => {
      if (isLegacyWorkspaceHealthHash(window.location.hash)) {
        router.replace(legacyWorkspaceHealthRedirectTarget());
      }
    };

    redirectIfLegacyHash();
    window.addEventListener("hashchange", redirectIfLegacyHash);

    return () => {
      window.removeEventListener("hashchange", redirectIfLegacyHash);
    };
  }, [router]);

  return null;
}
