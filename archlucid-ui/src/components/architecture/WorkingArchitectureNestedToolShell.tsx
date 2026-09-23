"use client";

import type { ReactNode } from "react";

import { WorkingArchitectureNestedKeyboardHint } from "@/components/architecture/WorkingArchitectureNestedKeyboardHint";
import { WorkingArchitectureNestedResumeStrip } from "@/components/architecture/WorkingArchitectureNestedResumeStrip";
import { WorkingArchitectureNestedToolContextStrip } from "@/components/architecture/WorkingArchitectureNestedToolContextStrip";
import { WorkingArchitectureNestedWayfinding } from "@/components/architecture/WorkingArchitectureNestedWayfinding";
import { WorkingInstrumentDocumentTitle } from "@/components/architecture/WorkingInstrumentDocumentTitle";
import { WorkingNestedArchitectureIdentityChrome } from "@/components/architecture/WorkingNestedArchitectureIdentityChrome";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import {
  WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID,
  workingArchitectureNestedClaimDiscipline,
  workingArchitectureNestedClaimDisciplineTestId,
  workingArchitectureNestedDocumentTitleSuffix,
  workingArchitectureNestedSkipLinkLabel,
  type WorkingArchitectureNestedToolLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const skipLinkLabel = workingArchitectureNestedSkipLinkLabel(props.toolLabel);

  return (
    <div className="space-y-2" data-testid="working-architecture-nested-tool-shell">
      <a
        href={`#${WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {skipLinkLabel}
      </a>
      <WorkingNestedArchitectureIdentityChrome architectureId={architectureId} />
      <WorkingArchitectureNestedWayfinding architectureId={architectureId} toolLabel={props.toolLabel} />
      {showResumeStrip ? <WorkingArchitectureNestedResumeStrip architectureId={architectureId} /> : null}
      <WorkingArchitectureNestedToolContextStrip toolLabel={props.toolLabel} />
      <PageHeaderClaimDiscipline
        text={workingArchitectureNestedClaimDiscipline(props.toolLabel)}
        testId={workingArchitectureNestedClaimDisciplineTestId(props.toolLabel)}
      />
      <WorkingArchitectureNestedKeyboardHint toolLabel={props.toolLabel} />
      {displayName.length > 0 ? (
        <WorkingInstrumentDocumentTitle
          architectureDisplayName={displayName}
          parentArchitectureId={architectureId}
          documentTitleSuffix={documentTitleSuffix}
        />
      ) : null}
      <div
        id={WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID}
        data-testid={WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        {props.children}
      </div>
    </div>
  );
}
