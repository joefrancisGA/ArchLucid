import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchTeamsIncomingWebhookPageBundle } from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import type { TeamsIncomingWebhookConnectionResponse } from "@/types/teams-incoming-webhook-connection";

export type TeamsNotificationsIntegrationDemoLoad = {
  readonly mode: "demo";
};

export type TeamsNotificationsIntegrationLiveLoad = {
  readonly mode: "live";
  readonly conn: TeamsIncomingWebhookConnectionResponse | null;
  readonly catalog: string[];
  readonly failure: ApiLoadFailureState | null;
};

export type TeamsNotificationsIntegrationPageServerLoad =
  | TeamsNotificationsIntegrationDemoLoad
  | TeamsNotificationsIntegrationLiveLoad;

export async function loadTeamsNotificationsIntegrationPageData(): Promise<TeamsNotificationsIntegrationPageServerLoad> {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (isDemo) {
    return { mode: "demo" };
  }

  try {
    const bundle = await fetchTeamsIncomingWebhookPageBundle();

    return {
      mode: "live",
      conn: bundle.connection,
      catalog: bundle.triggerCatalog,
      failure: null,
    };
  } catch (e: unknown) {
    return {
      mode: "live",
      conn: null,
      catalog: [],
      failure: toApiLoadFailure(e),
    };
  }
}
