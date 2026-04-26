"use client";

import { useCallback, useEffect, useState } from "react";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createDigestSubscription,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
  toggleDigestSubscription,
} from "@/lib/api";
import {
  alertToolingListRefreshButtonTitleOperator,
  alertToolingListRefreshButtonTitleReader,
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
  digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank,
  digestSubscriptionsDeliveryAttemptsButtonTitleOperator,
  digestSubscriptionsDeliveryAttemptsButtonTitleReader,
  digestSubscriptionsEmptyListOperatorLine,
  digestSubscriptionsEmptyListReaderLine,
  digestSubscriptionsToggleToDisabledReaderRank,
  digestSubscriptionsToggleToEnabledReaderRank,
  digestSubscriptionsYourSubscriptionsHeadingOperator,
  digestSubscriptionsYourSubscriptionsHeadingReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { cn } from "@/lib/utils";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";

/**
 * Subscriptions tab: email/webhook delivery config (Execute-class mutations; read-only list for Read rank).
 */
export function DigestSubscriptionsContent() {
  const canMutateSubscriptions = useEnterpriseMutationCapability();
  const [items, setItems] = useState<DigestSubscription[]>([]);
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [name, setName] = useState("Digest Subscription");
  const [channelType, setChannelType] = useState("Email");
  const [destination, setDestination] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await listDigestSubscriptions();
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
    if (!canMutateSubscriptions || !destination.trim()) {
      return;
    }

    setFailure(null);
    try {
      await createDigestSubscription({
        name: name.trim() || "Digest Subscription",
        channelType,
        destination: destination.trim(),
        isEnabled: true,
        metadataJson: "{}",
      });
      setDestination("");
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function onToggle(subscriptionId: string) {
    if (!canMutateSubscriptions) {
      return;
    }

    setFailure(null);
    try {
      await toggleDigestSubscription(subscriptionId);
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  async function loadAttempts(subscriptionId: string) {
    try {
      const rows = await listSubscriptionDeliveryAttempts(subscriptionId, 30);
      setAttemptsBySub((prev) => ({ ...prev, [subscriptionId]: rows }));
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="max-w-3xl">
      <h2 className="mt-0">Digest subscriptions</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        When an architecture digest is generated (scheduled or manual scan), enabled subscriptions in this scope receive
        a delivery attempt. Dev uses fake email/webhook loggers — check API logs for output.
      </p>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-6", !canMutateSubscriptions && "flex-col-reverse")}>
        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <h3 className="mt-0">New subscription</h3>
          <div className="grid max-w-2xl gap-3">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subscription name"
                readOnly={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Channel
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                disabled={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full p-2"
              >
                <option value="Email">Email</option>
                <option value="TeamsWebhook">Teams Webhook</option>
                <option value="SlackWebhook">Slack Webhook</option>
              </select>
            </label>
            <label>
              Destination (email or webhook URL)
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="you@example.com or https://..."
                readOnly={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 block w-full font-mono p-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void onCreate()}
              disabled={!destination.trim() || loading || !canMutateSubscriptions}
              title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
              className={cn(
                !canMutateSubscriptions &&
                  "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
              )}
            >
              {canMutateSubscriptions
                ? "Create subscription"
                : digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
            </button>
          </div>
        </section>

        <div>
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              title={
                canMutateSubscriptions
                  ? alertToolingListRefreshButtonTitleOperator
                  : alertToolingListRefreshButtonTitleReader
              }
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          <h3>
            {canMutateSubscriptions
              ? digestSubscriptionsYourSubscriptionsHeadingOperator
              : digestSubscriptionsYourSubscriptionsHeadingReader}
          </h3>
          <div className="grid gap-3">
            {items.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400">
                {canMutateSubscriptions
                  ? digestSubscriptionsEmptyListOperatorLine
                  : digestSubscriptionsEmptyListReaderLine}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.subscriptionId}
                  className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <strong>{item.name}</strong>
                  <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <div>Channel: {item.channelType}</div>
                    <div className="break-all">Destination: {item.destination}</div>
                    <div>Enabled: {String(item.isEnabled)}</div>
                    <div>
                      Last delivered:{" "}
                      {item.lastDeliveredUtc ? new Date(item.lastDeliveredUtc).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onToggle(item.subscriptionId)}
                      disabled={!canMutateSubscriptions}
                      title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                      className={cn(
                        !canMutateSubscriptions &&
                          "rounded border border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400",
                      )}
                    >
                      {canMutateSubscriptions
                        ? item.isEnabled
                          ? "Disable"
                          : "Enable"
                        : item.isEnabled
                          ? digestSubscriptionsToggleToDisabledReaderRank
                          : digestSubscriptionsToggleToEnabledReaderRank}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadAttempts(item.subscriptionId)}
                      title={
                        canMutateSubscriptions
                          ? digestSubscriptionsDeliveryAttemptsButtonTitleOperator
                          : digestSubscriptionsDeliveryAttemptsButtonTitleReader
                      }
                    >
                      {canMutateSubscriptions
                        ? "Show delivery attempts"
                        : digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank}
                    </button>
                  </div>
                  {attemptsBySub[item.subscriptionId]?.length ? (
                    <ul className="mt-3 pl-5 text-[13px]">
                      {attemptsBySub[item.subscriptionId].map((a) => (
                        <li key={a.attemptId}>
                          {a.status} — {new Date(a.attemptedUtc).toLocaleString()}
                          {a.errorMessage ? ` — ${a.errorMessage}` : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
