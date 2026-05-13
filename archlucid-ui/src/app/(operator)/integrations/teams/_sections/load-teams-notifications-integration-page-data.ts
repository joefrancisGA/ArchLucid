import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  getTeamsIncomingWebhookConnection,
  getTeamsNotificationTriggerCatalog,
} from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
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
    const [data, triggers] = await Promise.all([
      getTeamsIncomingWebhookConnection(),
      getTeamsNotificationTriggerCatalog(),
    ]);

    return {
      mode: "live",
      conn: data,
      catalog: triggers,
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
