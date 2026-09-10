import type { Metadata } from "next";

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import { ArchitecturesNewPageShell } from "./_sections/ArchitecturesNewPageShell";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

/**
 * Direct drafting entry — no draft interstitial. Server persist waits until the operator
 * enters saveable field content ({@link ArchitectureDraftWorkspace} deferred create).
 */
export default function NewArchitecturePage(): React.JSX.Element {
  return <ArchitecturesNewPageShell />;
}
