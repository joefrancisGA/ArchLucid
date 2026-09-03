"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  resolveProductionDeskChrome,
  resolveProductionEvalChrome,
} from "@/lib/production-desk-chrome";

/** True when the current seat should use working-desk chrome (dense architect instrument). */
export function useProductionDeskChrome(): boolean {
  const { mode } = useWorkspaceMode();

  return resolveProductionDeskChrome({ workspaceMode: mode });
}

/** True when eval/demo teaching chrome should apply for the current seat. */
export function useProductionEvalChrome(): boolean {
  const { mode } = useWorkspaceMode();

  return resolveProductionEvalChrome({ workspaceMode: mode });
}
