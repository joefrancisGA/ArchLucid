import { redirect } from "next/navigation";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

import { DeveloperSettingsPageClient } from "./DeveloperSettingsPageClient";

/** Internal developer tools — customer requests redirect to Preferences (server-enforced). */
export default function DeveloperSettingsPage() {
  if (!isShowSystemAdministrationNavEnabled()) {
    redirect("/administration/settings/preferences");
  }

  return <DeveloperSettingsPageClient />;
}
