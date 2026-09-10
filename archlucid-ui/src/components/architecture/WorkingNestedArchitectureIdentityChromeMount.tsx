"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { WorkingNestedArchitectureIdentityChrome } from "@/components/architecture/WorkingNestedArchitectureIdentityChrome";

type WorkingNestedArchitectureIdentityChromeMountProps = {
  readonly parentArchitectureId: string | null;
};

export function WorkingNestedArchitectureIdentityChromeMount(
  props: WorkingNestedArchitectureIdentityChromeMountProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const architectureId = props.parentArchitectureId?.trim() ?? "";

  if (!isWorkingMode || architectureId.length === 0) {
    return null;
  }

  return <WorkingNestedArchitectureIdentityChrome architectureId={architectureId} />;
}
