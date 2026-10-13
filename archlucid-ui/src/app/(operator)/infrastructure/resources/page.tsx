import type { Metadata } from "next";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";
import { getRouteTitle } from "@/lib/route-titles";

export const metadata: Metadata = {
  title: getRouteTitle("/infrastructure/resources"),
};

/** SecureNow resource explorer — search cloud resources and open the evidence hub. */
export default function SecureNowInfrastructureResourcesPage() {
  return <ResourcesExplorerClient />;
}
