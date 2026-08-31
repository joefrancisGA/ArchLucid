import type { Metadata } from "next";

import { WorkspaceHealthPageView } from "@/app/(operator)/insights/workspace-health/_sections/WorkspaceHealthPageView";
import { SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE } from "@/lib/sponsor-workspace-health-page-copy";

export const metadata: Metadata = {
  title: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
};

/** Workspace health (`/insights/workspace-health`). */
export default function WorkspaceHealthPage() {
  return <WorkspaceHealthPageView />;
}
