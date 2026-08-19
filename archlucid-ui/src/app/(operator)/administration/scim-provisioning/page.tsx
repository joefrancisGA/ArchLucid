import type { Metadata } from "next";

import { ScimProvisioningSettingsPageClient } from "./_sections/ScimProvisioningSettingsPageClient";

export const metadata: Metadata = {
  title: "SCIM provisioning",
};

/** Admin SCIM inbound provisioning token management. */
export default function ScimProvisioningSettingsPage() {
  return <ScimProvisioningSettingsPageClient />;
}
