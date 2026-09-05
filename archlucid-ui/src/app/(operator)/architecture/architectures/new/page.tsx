import type { Metadata } from "next";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ARCHITECTURE_NEW_DRAFT_SEGMENT, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import { ArchitecturesNewBreadcrumb } from "./_sections/ArchitecturesNewBreadcrumb";
import { ArchitecturesNewBuyerChrome } from "./_sections/ArchitecturesNewBuyerChrome";
import { ArchitecturesNewPageHeaderActions } from "./_sections/ArchitecturesNewPageHeaderActions";
import { ArchitecturesNewPageSubtitle } from "./_sections/ArchitecturesNewPageSubtitle";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

/**
 * Direct drafting entry — no draft interstitial. Server persist waits until the operator
 * enters saveable field content ({@link ArchitectureDraftWorkspace} deferred create).
 */
export default function NewArchitecturePage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <OperatorPageHeader
        title={CREATE_ARCHITECTURE_LABEL}
        subtitle={<ArchitecturesNewPageSubtitle />}
        navHref={ARCHITECTURES_NEW_PATH}
        headingLevel="h1"
        titleTestId="architecture-new-page-title"
        subtitleTestId="architecture-new-page-subtitle"
        breadcrumb={<ArchitecturesNewBreadcrumb />}
        actions={<ArchitecturesNewPageHeaderActions />}
      />
      <ArchitecturesNewBuyerChrome />
      <ArchitectureDraftWorkspace draftId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />
    </OperatorPageContainer>
  );
}
