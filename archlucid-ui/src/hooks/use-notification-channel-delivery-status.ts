"use client";

import { useQuery } from "@tanstack/react-query";

import { useDigestSubscriptionsQuery } from "@/hooks/use-digest-subscriptions-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  getTeamsIncomingWebhookConnection,
  listAlertRoutingSubscriptions,
  listAlertRules,
  listAlertsPaged,
  listCompositeAlertRules,
} from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  resolveNotificationChannelDeliveryStatus,
  type NotificationChannelDeliveryStatus,
  type NotificationChannelDeliveryStatusInput,
} from "@/lib/notification-preference-center";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

const SLACK_CHANNEL_TYPE = "SlackWebhook";

export type NotificationChannelDeliveryStatusMap = Readonly<
  Record<string, NotificationChannelDeliveryStatus>
>;

function isAuthorizationFailure(error: unknown): boolean {
  return isApiRequestError(error) && (error.httpStatus === 401 || error.httpStatus === 403);
}

export function useNotificationChannelDeliveryStatus(): {
  readonly statusByChannelId: NotificationChannelDeliveryStatusMap;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refresh: () => void;
} {
  const scope = useOperatorScopeQueryKey();
  const digestQuery = useDigestSubscriptionsQuery();

  const alertsSnapshotQuery = useQuery({
    queryKey: operatorQueryKeys.notificationChannelDeliverySnapshot(scope),
    queryFn: async () => {
      const [simpleRules, compositeRules, routingSubscriptions, openAlertsPage] = await Promise.all([
        listAlertRules(),
        listCompositeAlertRules(),
        listAlertRoutingSubscriptions(),
        listAlertsPaged("Open", 1, 1),
      ]);

      const enabledRulesCount =
        simpleRules.filter((rule) => rule.isEnabled).length
        + compositeRules.filter((rule) => rule.isEnabled).length;
      const enabledRoutingCount = routingSubscriptions.filter((row) => row.isEnabled).length;
      const slackRows = routingSubscriptions.filter((row) => row.channelType === SLACK_CHANNEL_TYPE);
      const activeSlackDestinationCount = slackRows.filter((row) => row.isEnabled === true).length;

      return {
        enabledRulesCount,
        enabledRoutingCount,
        openAlertsCount: openAlertsPage.totalCount,
        activeSlackDestinationCount,
        totalSlackDestinationCount: slackRows.length,
      };
    },
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  const teamsQuery = useQuery({
    queryKey: ["operator", "integrations", "teams", "incoming-webhook-connection", scope] as const,
    queryFn: () => getTeamsIncomingWebhookConnection(),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: (failureCount, error) => !isAuthorizationFailure(error) && failureCount < 1,
  });

  const digestSubscriptions = digestQuery.data ?? [];
  const alertsSnapshot = alertsSnapshotQuery.data;
  const teamsConnection = teamsQuery.data ?? null;

  const input: NotificationChannelDeliveryStatusInput = {
    digestSubscriptions,
    digestLoadState: digestQuery.isLoading
      ? "loading"
      : digestQuery.isError
        ? "error"
        : "ready",
    alertsLoadState: alertsSnapshotQuery.isLoading
      ? "loading"
      : alertsSnapshotQuery.isError
        ? "error"
        : "ready",
    enabledRulesCount: alertsSnapshot?.enabledRulesCount ?? 0,
    enabledRoutingCount: alertsSnapshot?.enabledRoutingCount ?? 0,
    openAlertsCount: alertsSnapshot?.openAlertsCount ?? 0,
    teamsLoadState: teamsQuery.isLoading
      ? "loading"
      : teamsQuery.isError
        ? "error"
        : "ready",
    teamsIsConfigured: teamsConnection?.isConfigured === true,
    teamsEnabledTriggerCount: teamsConnection?.enabledTriggers.length ?? 0,
    slackLoadState: alertsSnapshotQuery.isLoading
      ? "loading"
      : alertsSnapshotQuery.isError
        ? "error"
        : "ready",
    activeSlackDestinationCount: alertsSnapshot?.activeSlackDestinationCount ?? 0,
    totalSlackDestinationCount: alertsSnapshot?.totalSlackDestinationCount ?? 0,
  };

  const statusByChannelId = resolveNotificationChannelDeliveryStatus(input);
  const loading =
    digestQuery.isLoading || alertsSnapshotQuery.isLoading || teamsQuery.isLoading;
  const loadFailed =
    (digestQuery.isError && !isAuthorizationFailure(digestQuery.error))
    || (alertsSnapshotQuery.isError && !isAuthorizationFailure(alertsSnapshotQuery.error))
    || (teamsQuery.isError && !isAuthorizationFailure(teamsQuery.error));

  const refresh = (): void => {
    void digestQuery.refetch();
    void alertsSnapshotQuery.refetch();
    void teamsQuery.refetch();
  };

  return {
    statusByChannelId,
    loading,
    loadFailed,
    refresh,
  };
}
