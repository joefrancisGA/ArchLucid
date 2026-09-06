import type { Metadata } from "next";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
};

/** IE-UX-04 resource explorer — search cloud resources and open the evidence hub. */
export default function InfrastructureResourcesPage() {
  return <ResourcesExplorerClient />;
}
