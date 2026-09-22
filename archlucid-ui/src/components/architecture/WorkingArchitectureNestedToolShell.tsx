"use client";

import type { ReactNode } from "react";

import { WorkingArchitectureNestedKeyboardHint } from "@/components/architecture/WorkingArchitectureNestedKeyboardHint";
import { WorkingArchitectureNestedResumeStrip } from "@/components/architecture/WorkingArchitectureNestedResumeStrip";
import { WorkingArchitectureNestedWayfinding } from "@/components/architecture/WorkingArchitectureNestedWayfinding";
import { WorkingInstrumentDocumentTitle } from "@/components/architecture/WorkingInstrumentDocumentTitle";
import { WorkingNestedArchitectureIdentityChrome } from "@/components/architecture/WorkingNestedArchitectureIdentityChrome";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import {
  workingArchitectureNestedDocumentTitleSuffix,
  type WorkingArchitectureNestedToolLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";

export type WorkingArchitectureNestedToolShellProps = {
  readonly architectureId: string;
  readonly toolLabel: WorkingArchitectureNestedToolLabel;
  readonly children: ReactNode;
  readonly showResumeStrip?: boolean;
};

/** Working nested architecture tool chrome — resume strip, slug breadcrumb, status honesty, keyboard hints. */
export function WorkingArchitectureNestedToolShell(
  props: WorkingArchitectureNestedToolShellProps,
): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const architectureId = props.architectureId.trim();
  const showResumeStrip = props.showResumeStrip !== false;
  const identityQuery = useArchitectureIdentityQuery(architectureId, isWorkingMode && architectureId.length > 0);

  if (!isWorkingMode || architectureId.length === 0) {
    return <>{props.children}</>;
  }

  const displayName = identityQuery.data?.displayName?.trim() ?? "";
  const documentTitleSuffix = workingArchitectureNestedDocumentTitleSuffix(props.toolLabel);

  return (
    <div className="space-y-2" data-testid="working-architecture-nested-tool-shell">
      <WorkingNestedArchitectureIdentityChrome architectureId={architectureId} />
      <WorkingArchitectureNestedWayfinding architectureId={architectureId} toolLabel={props.toolLabel} />
      {showResumeStrip ? <WorkingArchitectureNestedResumeStrip architectureId={architectureId} /> : null}
      <WorkingArchitectureNestedKeyboardHint />
      {displayName.length > 0 ? (
        <WorkingInstrumentDocumentTitle
          architectureDisplayName={displayName}
          parentArchitectureId={architectureId}
          documentTitleSuffix={documentTitleSuffix}
        />
      ) : null}
      {props.children}
    </div>
  );
}
