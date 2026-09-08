"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ProjectsRecycleBinClaimOrientationStrip } from "./ProjectsRecycleBinClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary projects recycle bin workspace (STR). */
export function ProjectsRecycleBinBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="projects-recycle-bin-orientation-bottom">
      <ProjectsRecycleBinClaimOrientationStrip />
    </div>
  );
}
