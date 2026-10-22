"use client";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ARCHITECTURE_NEW_DRAFT_SEGMENT, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { ARCHITECTURES_NEW_CLAIM_DISCIPLINE } from "@/lib/architectures-new-evidence-copy";
import {
  ARCHITECTURES_NEW_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURES_NEW_PRIMARY_CONTENT_ID,
  ARCHITECTURES_NEW_SKIP_LINK_LABEL,
  ARCHITECTURES_NEW_SKIP_TARGET_ID,
} from "@/lib/architectures-new-page-copy";
import { cn } from "@/lib/utils";

import { ArchitecturesNewBreadcrumb } from "./ArchitecturesNewBreadcrumb";
import { ArchitecturesNewBuyerChrome } from "./ArchitecturesNewBuyerChrome";
import { ArchitecturesNewPageHeaderActions } from "./ArchitecturesNewPageHeaderActions";
import { ArchitecturesNewPageSubtitle } from "./ArchitecturesNewPageSubtitle";

/** Guided buyer/eval layout for `/architecture/architectures/new` (ANE). */
export function ArchitecturesNewPageShell(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const createArchitectureWorkspaceBody = (
    <>
      <ArchitecturesNewBuyerChrome />
      <ArchitectureDraftWorkspace draftId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />
    </>
  );

  const pageHeader = (
    <OperatorPageHeader
      title={CREATE_ARCHITECTURE_LABEL}
      subtitle={<ArchitecturesNewPageSubtitle />}
      claimDiscipline={buyerPolishedShell ? ARCHITECTURES_NEW_CLAIM_DISCIPLINE : undefined}
      claimDisciplineTestId="architectures-new-claim-discipline"
      navHref={ARCHITECTURES_NEW_PATH}
      headingLevel="h1"
      titleTestId="architecture-new-page-title"
      subtitleTestId="architecture-new-page-subtitle"
      breadcrumb={<ArchitecturesNewBreadcrumb />}
      actions={<ArchitecturesNewPageHeaderActions />}
    />
  );

  return (
    <OperatorPageContainer variant="workflow">
      {buyerPolishedShell ? (
        <>
          <a
            href={`#${ARCHITECTURES_NEW_SKIP_TARGET_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {ARCHITECTURES_NEW_SKIP_LINK_LABEL}
          </a>

          <div
            id={ARCHITECTURES_NEW_PRIMARY_CONTENT_ID}
            data-testid="architectures-new-primary-content"
            className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
          >
            {pageHeader}

            <div
              id={ARCHITECTURES_NEW_SKIP_TARGET_ID}
              data-testid={ARCHITECTURES_NEW_FIRST_VIEWPORT_TEST_ID}
              className={cn(
                "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_LAYOUT.sectionStack,
              )}
            >
              {createArchitectureWorkspaceBody}
            </div>
          </div>
        </>
      ) : (
        <>
          {pageHeader}
          {createArchitectureWorkspaceBody}
        </>
      )}
    </OperatorPageContainer>
  );
}
