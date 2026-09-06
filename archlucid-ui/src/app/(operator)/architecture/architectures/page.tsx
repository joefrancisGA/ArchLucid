import type { Metadata } from "next";

import { ArchitecturesHubListSection } from "./_sections/ArchitecturesHubListSection";
import { ArchitecturesHubObjectMapStrip } from "./_sections/ArchitecturesHubObjectMapStrip";
import { ArchitecturesHubPageHeader } from "./_sections/ArchitecturesHubPageHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

import { ArchitecturesHubBuyerChrome } from "./_sections/ArchitecturesHubBuyerChrome";

export const metadata: Metadata = {
  title: ARCHITECTURES_HUB_PAGE_TITLE,
};

export default function ArchitecturesListPage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <ArchitecturesHubPageHeader />
      <ArchitecturesHubObjectMapStrip />
      <ArchitecturesHubListSection />
      <ArchitecturesHubBuyerChrome />
    </OperatorPageContainer>
  );
}
