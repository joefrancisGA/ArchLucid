"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH, WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

/** Sends legacy `#workspace-health` sponsor-dashboard bookmarks to the standalone page. */
export function SponsorDashboardLegacyWorkspaceHealthHashRedirect(): null {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash === `#${LEGACY_SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HASH}`) {
      router.replace(WORKSPACE_HEALTH_PATH);
    }
  }, [router]);

  return null;
}
