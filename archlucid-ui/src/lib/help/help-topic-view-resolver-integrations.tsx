import type { ReactElement } from "react";
import dynamic from "next/dynamic";

import type { LoadedHelpTopicContent } from "@/lib/help/help-topic-content-loader";
import { readSearchParam, resolveAzurePermissionsReturnHref, resolveGcpConnectionHelpReturnHref } from "./help-topic-view-resolver-shared";


const HelpAzureBoardsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAzureBoardsGuideView").then((module) => module.HelpAzureBoardsGuideView),
);
const HelpAzurePermissionsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpAzurePermissionsGuideView").then((module) => module.HelpAzurePermissionsGuideView),
);
const HelpCloudConnectionsGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView").then((module) => module.HelpCloudConnectionsGuideView),
);
const HelpConnectAwsSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView").then((module) => module.HelpConnectAwsSecurelyGuideView),
);
const HelpConnectAzureSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView").then((module) => module.HelpConnectAzureSecurelyGuideView),
);
const HelpConnectGcpSecurelyGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView").then((module) => module.HelpConnectGcpSecurelyGuideView),
);
const HelpIntegrationReadinessGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView").then(
    (module) => module.HelpIntegrationReadinessGuideView,
  ),
);
const HelpJiraIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpJiraIntegrationGuideView").then((module) => module.HelpJiraIntegrationGuideView),
);
const HelpServiceNowIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView").then((module) => module.HelpServiceNowIntegrationGuideView),
);
const HelpSlackIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView").then((module) => module.HelpSlackIntegrationGuideView),
);
const HelpTeamsIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView").then((module) => module.HelpTeamsIntegrationGuideView),
);
const HelpWebhooksIntegrationGuideView = dynamic(() =>
  import("@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView").then((module) => module.HelpWebhooksIntegrationGuideView),
);

export function tryResolveIntegrationsHelpTopicView(
  loaded: LoadedHelpTopicContent,
  searchParams?: Record<string, string | string[] | undefined>,
): ReactElement | null {
  if (loaded.entry.slug === "cloud-connections") {
    return <HelpCloudConnectionsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "slack-integration") {
    return <HelpSlackIntegrationGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "teams-integration") {
    return <HelpTeamsIntegrationGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "webhooks-integration") {
    return <HelpWebhooksIntegrationGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "jira-integration") {
    return <HelpJiraIntegrationGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "servicenow-integration") {
    return <HelpServiceNowIntegrationGuideView entry={loaded.entry} />;
  }
  if (loaded.entry.slug === "cloud-connections-azure") {
    return (
      <HelpConnectAzureSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }
  if (loaded.entry.slug === "cloud-connections-aws") {
    return (
      <HelpConnectAwsSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }
  if (loaded.entry.slug === "cloud-connections-gcp") {
    return (
      <HelpConnectGcpSecurelyGuideView
        entry={loaded.entry}
        returnHref={resolveGcpConnectionHelpReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }
  if (loaded.entry.slug === "azure-permissions") {
    return (
      <HelpAzurePermissionsGuideView
        entry={loaded.entry}
        subscriptionId={readSearchParam(searchParams, "subscriptionId")}
        returnHref={resolveAzurePermissionsReturnHref(readSearchParam(searchParams, "returnTo"))}
      />
    );
  }
  if (loaded.entry.slug === "azure-boards") {
    return <HelpAzureBoardsGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }
  if (loaded.entry.slug === "integration-readiness") {
    return <HelpIntegrationReadinessGuideView entry={loaded.entry} markdown={loaded.markdown} />;
  }

  return null;
}
