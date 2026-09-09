"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ARCHITECTURES_HUB_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURES_HUB_PRIMARY_CONTENT_ID,
  ARCHITECTURES_HUB_SKIP_LINK_LABEL,
  ARCHITECTURES_HUB_SKIP_TARGET_ID,
} from "@/lib/architectures-hub-copy";
import { cn } from "@/lib/utils";

import { ArchitecturesHubBuyerChrome } from "./ArchitecturesHubBuyerChrome";
import { ArchitecturesHubListSection } from "./ArchitecturesHubListSection";
import { ArchitecturesHubObjectMapStrip } from "./ArchitecturesHubObjectMapStrip";
import { ArchitecturesHubPageHeader } from "./ArchitecturesHubPageHeader";

/** Shared `/architecture/architectures` layout — skip link, header, and draft inventory workspace (ARA). */
export function ArchitecturesHubPageShell(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const evalChromeShell = useProductionEvalChrome();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showGuidedBuyerLayout = !isWorkingMode && (evalChromeShell || buyerPolishedShell);

  const architecturesHubWorkspaceBody = (
    <>
      <ArchitecturesHubObjectMapStrip />
      <ArchitecturesHubListSection />
    </>
  );

  return (
    <OperatorPageContainer variant="workflow">
      {showGuidedBuyerLayout ? (
        <>
          <a
            href={`#${ARCHITECTURES_HUB_SKIP_TARGET_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {ARCHITECTURES_HUB_SKIP_LINK_LABEL}
          </a>

          <div
            id={ARCHITECTURES_HUB_PRIMARY_CONTENT_ID}
            data-testid="architectures-hub-primary-content"
            className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
          >
            <ArchitecturesHubPageHeader />

            <div
              id={ARCHITECTURES_HUB_SKIP_TARGET_ID}
              data-testid={ARCHITECTURES_HUB_FIRST_VIEWPORT_TEST_ID}
              className={cn(
                "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_LAYOUT.sectionStack,
              )}
            >
              <ArchitecturesHubBuyerChrome />
              {architecturesHubWorkspaceBody}
            </div>
          </div>
        </>
      ) : (
        <>
          <ArchitecturesHubPageHeader />
          {architecturesHubWorkspaceBody}
        </>
      )}
    </OperatorPageContainer>
  );
}
