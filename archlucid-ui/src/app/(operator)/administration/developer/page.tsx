import { redirect } from "next/navigation";

import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

import { DeveloperSettingsPageClient } from "./DeveloperSettingsPageClient";

/** Internal developer tools — customer requests redirect to Preferences (server-enforced). */
export default function DeveloperSettingsPage() {
  if (!isShowSystemAdministrationNavEnabled()) {
    redirect(ACCOUNT_PREFERENCES_PATH);
  }

  return <DeveloperSettingsPageClient />;
}
