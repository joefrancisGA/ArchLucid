"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  alertRoutingCreateSubscriptionButtonLabelReaderRank,
  alertRoutingCurrentRoutingHeadingOperator,
  alertRoutingCurrentRoutingHeadingReader,
  alertRoutingDeliveryAttemptsButtonTitleOperator,
  alertRoutingDeliveryAttemptsButtonTitleReader,
  alertRoutingDeliveryAttemptsButtonLabelReaderRank,
  alertRoutingPageLeadOperator,
  alertRoutingPageLeadReader,
  alertRoutingSubscriptionsEmptyOperatorLine,
  alertRoutingSubscriptionsEmptyReaderLine,
  alertRoutingToggleToDisabledReaderRank,
  alertRoutingToggleToEnabledReaderRank,
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingChangeConfigurationHeadingReader,
  alertToolingConfigureSectionSubline,
  alertToolingListRefreshButtonTitleOperator,
  alertToolingListRefreshButtonTitleReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { cn } from "@/lib/utils";
import {
  createAlertRoutingSubscription,
  listAlertRoutingDeliveryAttempts,
  listAlertRoutingSubscriptions,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription } from "@/types/alert-routing";

export function AlertRoutingContent() {
  const canMutateRouting = useEnterpriseMutationCapability();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, AlertRoutingDeliveryAttempt[]>>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [name, setName] = useState("Alert Routing");
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");
  const [minimumSeverity, setMinimumSeverity] = useState("High");

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await listAlertRoutingSubscriptions();
      setItems(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    if (!canMutateRouting || !destination.trim()) return;
    setFailure(null);
    try {
      await createAlertRoutingSubscription({
        name: name.trim() || "Alert Routing",
        channelType,
        destination: destination.trim(),
        minimumSeverity,
        isEnabled: true,
      });
      setDestination("");
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function onToggle(id: string) {
    if (!canMutateRouting) {
      return;
    }

    setFailure(null);
    try {
      await toggleAlertRoutingSubscription(id);
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function loadAttempts(routingSubscriptionId: string) {
    try {
      const rows = await listAlertRoutingDeliveryAttempts(routingSubscriptionId, 30);
      setAttemptsBySub((prev) => ({ ...prev, [routingSubscriptionId]: rows }));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-3xl">
      <LayerHeader pageKey="alert-routing" />
      <h2 className="mt-0">Alert routing</h2>
      <p className="mb-2 max-w-prose text-sm leading-snug text-neutral-600 dark:text-neutral-400">
        {canMutateRouting ? alertRoutingPageLeadOperator : alertRoutingPageLeadReader}
      </p>
      <AlertOperatorToolingRankCue />

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        <section
          className={cn("min-w-0", !canMutateRouting && "opacity-95")}
          aria-labelledby="alert-routing-current-heading"
        >
          <h3 id="alert-routing-current-heading" className="mb-2 mt-1 text-base">
            {canMutateRouting ? alertRoutingCurrentRoutingHeadingOperator : alertRoutingCurrentRoutingHeadingReader}
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="mb-2"
            title={
              canMutateRouting ? alertToolingListRefreshButtonTitleOperator : alertToolingListRefreshButtonTitleReader
            }
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <div className="grid gap-3">
            {items.length === 0 ? (
              <p className="max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
                {canMutateRouting ? alertRoutingSubscriptionsEmptyOperatorLine : alertRoutingSubscriptionsEmptyReaderLine}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.routingSubscriptionId}
                  className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <strong>{item.name}</strong>
                  <div className="mt-2 text-sm">
                    <div>Channel: {item.channelType}</div>
                    <div className="break-all">Destination: {item.destination}</div>
                    <div>Minimum severity: {item.minimumSeverity}</div>
                    <div>Enabled: {String(item.isEnabled)}</div>
                    <div>
                      Last delivered: {item.lastDeliveredUtc ? new Date(item.lastDeliveredUtc).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void loadAttempts(item.routingSubscriptionId)}
                      title={
                        canMutateRouting
                          ? alertRoutingDeliveryAttemptsButtonTitleOperator
                          : alertRoutingDeliveryAttemptsButtonTitleReader
                      }
                    >
                      {canMutateRouting ? "Show delivery attempts" : alertRoutingDeliveryAttemptsButtonLabelReaderRank}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onToggle(item.routingSubscriptionId)}
                      disabled={!canMutateRouting}
                      title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                      className={cn(
                        !canMutateRouting &&
                          "rounded border border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400",
                      )}
                    >
                      {canMutateRouting
                        ? item.isEnabled
                          ? "Disable"
                          : "Enable"
                        : item.isEnabled
                          ? alertRoutingToggleToDisabledReaderRank
                          : alertRoutingToggleToEnabledReaderRank}
                    </button>
                  </div>
                  {attemptsBySub[item.routingSubscriptionId]?.length ? (
                    <ul className="mt-3 pl-5 text-[13px]">
                      {attemptsBySub[item.routingSubscriptionId].map((a) => (
                        <li key={a.alertDeliveryAttemptId}>
                          {a.status} — alert {a.alertId.slice(0, 8)}… — {new Date(a.attemptedUtc).toLocaleString()}
                          {a.errorMessage ? ` — ${a.errorMessage}` : null}
                          {a.retryCount > 0 ? ` (retries: ${a.retryCount})` : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className={cn("min-w-0", !canMutateRouting && "opacity-90")}
          aria-labelledby="alert-routing-change-heading"
        >
          <h3 id="alert-routing-change-heading" className="mb-2 mt-1 text-base">
            {canMutateRouting
              ? alertToolingChangeConfigurationHeadingOperator
              : alertToolingChangeConfigurationHeadingReader}
          </h3>
          <p className="mb-2.5 mt-0 max-w-xl text-xs text-neutral-500 dark:text-neutral-400">
            {alertToolingConfigureSectionSubline}
          </p>
          <div className="mb-4 grid max-w-2xl gap-3">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canMutateRouting}
                title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Channel
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                disabled={!canMutateRouting}
                title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              >
                <option value="Email">Email</option>
                <option value="TeamsWebhook">Teams Webhook</option>
                <option value="SlackWebhook">Slack Webhook</option>
                <option value="OnCallWebhook">On-Call Webhook</option>
              </select>
            </label>
            <label>
              Destination
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Email or webhook URL"
                disabled={!canMutateRouting}
                title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full font-mono p-2"
              />
            </label>
            <label>
              Minimum severity
              <select
                value={minimumSeverity}
                onChange={(e) => setMinimumSeverity(e.target.value)}
                disabled={!canMutateRouting}
                title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              >
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void onCreate()}
              disabled={!destination.trim() || loading || !canMutateRouting}
              title={canMutateRouting ? undefined : enterpriseMutationControlDisabledTitle}
            >
              {canMutateRouting
                ? "Create alert routing subscription"
                : alertRoutingCreateSubscriptionButtonLabelReaderRank}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
