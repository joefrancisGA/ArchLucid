"use client";

import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

/** Working hub focuses the durable architecture object; Guided keeps draft teaching (CA-25). */
export function ArchitecturesHubObjectMapStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return <ArchitectureObjectMapStrip focus={isWorkingMode ? "architecture" : "draft"} />;
}
