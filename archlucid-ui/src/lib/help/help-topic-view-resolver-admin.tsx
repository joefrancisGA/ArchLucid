import type { ReactElement } from "react";
import dynamic from "next/dynamic";

import type { LoadedHelpTopicContent } from "@/lib/help/help-topic-content-loader";


const HelpAdminDiagnosticsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView").then((module) => module.HelpAdminDiagnosticsGuideView),
);
const HelpAiUsageGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAiUsageGuideView").then((module) => module.HelpAiUsageGuideView),
);
const HelpApiContractsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpApiContractsGuideView").then((module) => module.HelpApiContractsGuideView),
);
const HelpApiKeysGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpApiKeysGuideView").then((module) => module.HelpApiKeysGuideView),
);
const HelpAuthenticationSignInGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView").then(
    (module) => module.HelpAuthenticationSignInGuideView,
  ),
);
const HelpBillingAndPlansGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpBillingAndPlansGuideView").then((module) => module.HelpBillingAndPlansGuideView),
);
const HelpContactSupportGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpContactSupportGuideView").then((module) => module.HelpContactSupportGuideView),
);
const HelpNotificationsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpNotificationsGuideView").then((module) => module.HelpNotificationsGuideView),
);
const HelpPreferencesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpPreferencesGuideView").then((module) => module.HelpPreferencesGuideView),
);
const HelpReportAProblemGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpReportAProblemGuideView").then((module) => module.HelpReportAProblemGuideView),
);
const HelpSystemHealthGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSystemHealthGuideView").then((module) => module.HelpSystemHealthGuideView),
);
const HelpUsersAndRolesGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView").then((module) => module.HelpUsersAndRolesGuideView),
);
const HelpWorkspaceSettingsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView").then((module) => module.HelpWorkspaceSettingsGuideView),
);

export function tryResolveAdminHelpTopicView(
  loaded: LoadedHelpTopicContent,
): ReactElement | null {
  if (loaded.entry.slug === "api-keys") {
    return <HelpApiKeysGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "system-health") {
    return <HelpSystemHealthGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "ai-usage") {
    return <HelpAiUsageGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "preferences") {
    return <HelpPreferencesGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "notifications") {
    return <HelpNotificationsGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "workspace-settings") {
    return <HelpWorkspaceSettingsGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "billing-and-plans") {
    return <HelpBillingAndPlansGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "users-and-roles") {
    return <HelpUsersAndRolesGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "api-contracts") {
    return <HelpApiContractsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "admin-diagnostics") {
    return <HelpAdminDiagnosticsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "authentication-sign-in") {
    return <HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "report-a-problem") {
    return <HelpReportAProblemGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "contact-support") {
    return <HelpContactSupportGuideView entry={loaded.entry} />;
  }

  return null;
}
