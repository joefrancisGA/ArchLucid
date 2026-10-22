import type { Metadata } from "next";
import { Suspense } from "react";

import { ScimProvisioningLoadingView } from "@/app/(operator)/administration/scim-provisioning/ScimProvisioningLoadingView";
import { ScimProvisioningSettingsPageClient } from "./_sections/ScimProvisioningSettingsPageClient";
import {
  SCIM_PROVISIONING_PAGE_METADATA_DESCRIPTION,
  SCIM_PROVISIONING_PAGE_METADATA_TITLE,
} from "@/lib/scim-provisioning-page-copy";

export const metadata: Metadata = {
  title: SCIM_PROVISIONING_PAGE_METADATA_TITLE,
  description: SCIM_PROVISIONING_PAGE_METADATA_DESCRIPTION,
};

function ScimProvisioningLoading(): React.JSX.Element {
  return <ScimProvisioningLoadingView />;
}

/** Admin SCIM inbound provisioning token management. */
export default function ScimProvisioningSettingsPage(): React.JSX.Element {
  return (
    <Suspense fallback={<ScimProvisioningLoading />}>
      <ScimProvisioningSettingsPageClient />
    </Suspense>
  );
}
