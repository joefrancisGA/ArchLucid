"use client";

import { useContext } from "react";

import { WorkspaceModeContext } from "@/components/WorkspaceModeProvider";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

/** True when Guided-mode teaching chrome should render. */
export function useTeachingChromeVisible(): boolean {
  const context = useContext(WorkspaceModeContext);

  if (context === null) {
    return false;
  }

  if (!context.mounted) {
    return false;
  }

  return isGuidedWorkspaceMode(context.mode);
}
