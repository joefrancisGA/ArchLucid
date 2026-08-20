import type { Metadata } from "next";

import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

import { ArchitecturesHubBreadcrumb } from "./_sections/ArchitecturesHubBreadcrumb";
import { ArchitecturesHubBuyerChrome } from "./_sections/ArchitecturesHubBuyerChrome";
import { ArchitecturesHubHeaderActions } from "./_sections/ArchitecturesHubHeaderActions";
import { ArchitecturesHubPageSubtitle } from "./_sections/ArchitecturesHubPageSubtitle";

export const metadata: Metadata = {
  title: ARCHITECTURES_HUB_PAGE_TITLE,
};

export default function ArchitecturesListPage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <OperatorPageHeader
        title={ARCHITECTURES_HUB_PAGE_TITLE}
        subtitle={<ArchitecturesHubPageSubtitle />}
        navHref={ARCHITECTURES_LIST_PATH}
        headingLevel="h1"
        titleTestId="architectures-hub-page-title"
        subtitleTestId="architectures-hub-page-subtitle"
        breadcrumb={<ArchitecturesHubBreadcrumb />}
        actions={<ArchitecturesHubHeaderActions />}
      />
      <ArchitectureObjectMapStrip focus="draft" />
      <ArchitecturesHubBuyerChrome />
      <ArchitectureDraftListClient />
    </OperatorPageContainer>
  );
}
