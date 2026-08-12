import type { Metadata } from "next";

import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";

import { ArchitecturesHubHeaderActions } from "./_sections/ArchitecturesHubHeaderActions";
import {
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

export const metadata: Metadata = {
  title: ARCHITECTURES_HUB_PAGE_TITLE,
};

export default function ArchitecturesListPage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <OperatorPageHeader
        title={ARCHITECTURES_HUB_PAGE_TITLE}
        subtitle={ARCHITECTURES_HUB_PAGE_SUBTITLE}
        navHref={ARCHITECTURES_LIST_PATH}
        headingLevel="h1"
        titleTestId="architectures-hub-page-title"
        subtitleTestId="architectures-hub-page-subtitle"
        actions={<ArchitecturesHubHeaderActions />}
      />
      <ArchitectureDraftListClient />
    </OperatorPageContainer>
  );
}
