import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";
import { readWorkspaceModeFromStorage } from "@/lib/workspace-mode/workspace-mode-preference";

/** Eval-chrome gate for loaders and non-hook modules (CD-04). */
export function resolveProductionEvalChromeFromStorage(): boolean {
  return resolveProductionEvalChrome({ workspaceMode: readWorkspaceModeFromStorage() });
}
