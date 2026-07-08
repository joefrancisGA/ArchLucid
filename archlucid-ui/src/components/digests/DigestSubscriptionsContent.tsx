"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  channelDestinationHelper,
  channelDisplayLabel,
  DIGEST_SUBSCRIPTION_CHANNELS,
  DIGEST_TYPE_OPTIONS,
  formatDeliveryResult,
  isDigestSubscriptionFormValid,
  resolveSubscriptionStatusBadge,
  validateDigestSubscriptionDestination,
} from "@/lib/digest-subscription-form";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createDigestSubscription,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
  toggleDigestSubscription,
} from "@/lib/api";
import {
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
  digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank,
  digestSubscriptionsDeliveryAttemptsButtonTitleOperator,
  digestSubscriptionsDeliveryAttemptsButtonTitleReader,
  digestSubscriptionsToggleToDisabledReaderRank,
  digestSubscriptionsToggleToEnabledReaderRank,
  digestSubscriptionsYourSubscriptionsHeadingOperator,
  digestSubscriptionsYourSubscriptionsHeadingReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";

const SUBSCRIPTIONS_SUBTITLE =
  "Choose who receives architecture digest summaries and where they are delivered.";

const SUBSCRIPTIONS_PRIVACY_NOTE =
  "Digest subscriptions send summary content and links back to ArchLucid. Sensitive evidence content is not included unless explicitly configured.";

const CHANNEL_GUIDANCE =
  "Email delivers digests to a person or group mailbox. Webhooks deliver the same summary payload to Teams, Slack, or another HTTPS endpoint for automation.";

/**
 * Subscriptions tab: email/webhook delivery config (Execute-class mutations; read-only list for Read rank).
 */
export function DigestSubscriptionsContent(): ReactElement {
  const canMutateSubscriptions = useOperateCapability();
  const [items, setItems] = useState<DigestSubscription[]>([]);
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [lastUpdatedUtc, setLastUpdatedUtc] = useState<string | null>(null);
  const [destinationTouched, setDestinationTouched] = useState(false);

  const [name, setName] = useState("Architecture digest");
  const [channelType, setChannelType] = useState<string>("Email");
  const [destination, setDestination] = useState("");
  const [digestType, setDigestType] = useState<string>(DIGEST_TYPE_OPTIONS[0].value);
  const [createEnabled, setCreateEnabled] = useState(true);

  const formCardRef = useRef<HTMLElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await listDigestSubscriptions();
      setItems(data);

      const attemptEntries = await Promise.all(
        data.map(async (item) => {
          try {
            const rows = await listSubscriptionDeliveryAttempts(item.subscriptionId, 30);
            return [item.subscriptionId, rows] as const;
          } catch {
            return [item.subscriptionId, [] as DigestDeliveryAttempt[]] as const;
          }
        }),
      );
      const nextAttempts: Record<string, DigestDeliveryAttempt[]> = {};

      for (const [subscriptionId, rows] of attemptEntries) {
        nextAttempts[subscriptionId] = rows;
      }

      setAttemptsBySub(nextAttempts);
      setLastUpdatedUtc(new Date().toISOString());
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, [load]);

  const destinationError: string | null = useMemo(
    () => validateDigestSubscriptionDestination(channelType, destination),
    [channelType, destination],
  );

  const formValid: boolean = useMemo(
    () =>
      isDigestSubscriptionFormValid({
        name,
        channelType,
        destination,
      }),
    [name, channelType, destination],
  );

  const lastUpdatedLabel: string =
    lastUpdatedUtc === null
      ? "—"
      : new Date(lastUpdatedUtc).toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });

  async function onCreate(): Promise<void> {
    if (!canMutateSubscriptions || !formValid || creating) {
      return;
    }

    setCreating(true);
    setCreateSuccess(false);
    setFailure(null);

    try {
      await createDigestSubscription({
        name: name.trim() || "Architecture digest",
        channelType,
        destination: destination.trim(),
        isEnabled: createEnabled,
        metadataJson: JSON.stringify({ digestType }),
      });
      setDestination("");
      setDestinationTouched(false);
      setCreateSuccess(true);

      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => {
        setCreateSuccess(false);
      }, 4000);

      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(subscriptionId: string): Promise<void> {
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

  async function onViewHistory(subscriptionId: string): Promise<void> {
    setFailure(null);

    try {
      const rows = await listSubscriptionDeliveryAttempts(subscriptionId, 30);
      setAttemptsBySub((prev) => ({ ...prev, [subscriptionId]: rows }));
      setHistoryOpenFor((current) => (current === subscriptionId ? null : subscriptionId));
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  function focusCreateForm(): void {
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const nameInput = document.getElementById("digest-subscription-name");

    if (nameInput instanceof HTMLElement) {
      nameInput.focus();
    }
  }

  return (
    <div className="w-full max-w-[1400px] space-y-4" data-testid="digest-subscriptions-content">
      <div>
        <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
          Digest subscriptions
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {SUBSCRIPTIONS_SUBTITLE}
        </p>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {CHANNEL_GUIDANCE}
        </p>
      </div>

      <p
        className={cn(
          "m-0 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="digest-subscriptions-privacy-note"
      >
        {SUBSCRIPTIONS_PRIVACY_NOTE}
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

      <div className={cn("grid gap-4", !canMutateSubscriptions && "lg:grid-flow-dense")}>
        <section
          ref={formCardRef}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
          data-testid="digest-subscription-create-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              New subscription
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void load()}
                disabled={loading}
                data-testid="digest-subscriptions-refresh"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              <span
                className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="digest-subscriptions-last-updated"
              >
                Last updated: {lastUpdatedLabel}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="digest-subscription-name">Subscription name</Label>
              <Input
                id="digest-subscription-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Architecture digest"
                readOnly={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="digest-subscription-channel">Channel</Label>
              <select
                id="digest-subscription-channel"
                value={channelType}
                onChange={(e) => {
                  setChannelType(e.target.value);
                  setDestinationTouched(false);
                }}
                disabled={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                className={cn(
                  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {DIGEST_SUBSCRIPTION_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channelDisplayLabel(channel)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="digest-subscription-destination">Destination</Label>
              <Input
                id="digest-subscription-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onBlur={() => setDestinationTouched(true)}
                placeholder={channelType === "Email" ? "ops@example.com" : "https://…"}
                readOnly={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                aria-invalid={destinationTouched && destinationError !== null}
                aria-describedby="digest-subscription-destination-help"
              />
              <p
                id="digest-subscription-destination-help"
                className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              >
                {channelDestinationHelper(channelType)}
              </p>
              {destinationTouched && destinationError !== null ? (
                <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                  {destinationError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="digest-subscription-type">Digest type</Label>
              <select
                id="digest-subscription-type"
                value={digestType}
                onChange={(e) => setDigestType(e.target.value)}
                disabled={!canMutateSubscriptions}
                title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                className={cn(
                  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {DIGEST_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="digest-subscription-enabled">Status</Label>
              <label
                htmlFor="digest-subscription-enabled"
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-3 dark:border-neutral-800",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                <input
                  id="digest-subscription-enabled"
                  type="checkbox"
                  checked={createEnabled}
                  onChange={(e) => setCreateEnabled(e.target.checked)}
                  disabled={!canMutateSubscriptions}
                  title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                />
                <span>{createEnabled ? "Active on create" : "Paused on create"}</span>
              </label>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => void onCreate()}
              disabled={!formValid || loading || creating || !canMutateSubscriptions}
              title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
              data-testid="digest-subscription-create-button"
            >
              {creating
                ? "Creating…"
                : canMutateSubscriptions
                  ? "Create subscription"
                  : digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
            </Button>
            {createSuccess ? (
              <span
                className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="digest-subscription-create-success"
                role="status"
              >
                Subscription created
              </span>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {canMutateSubscriptions
              ? digestSubscriptionsYourSubscriptionsHeadingOperator
              : digestSubscriptionsYourSubscriptionsHeadingReader}
          </h3>

          {!loading && items.length === 0 ? (
            <div className="mt-3" data-testid="digest-subscriptions-empty-state">
              <EnterpriseCompactEmptyState
                testId="digest-subscriptions-empty"
                title="No digest subscriptions yet"
                description="Create a subscription to deliver scheduled architecture digests to an email address, group mailbox, or webhook."
                actions={[]}
                footer={
                  canMutateSubscriptions ? (
                    <Button type="button" size="sm" variant="primary" onClick={focusCreateForm}>
                      Create subscription
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="mt-3 space-y-3">
              <EnterpriseTable ariaLabel="Digest subscriptions">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Channel</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Destination</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Last delivery</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Delivery result</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {items.map((item) => {
                    const attempts = attemptsBySub[item.subscriptionId] ?? [];
                    const status = resolveSubscriptionStatusBadge(item, attempts);

                    return (
                      <EnterpriseTableRow key={item.subscriptionId}>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.body}>{item.name}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.helper}>{channelDisplayLabel(item.channelType)}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={cn("break-all", OPERATOR_TYPOGRAPHY.helper)}>{item.destination}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <StatusTag kind={status.kind} label={status.label} />
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.helper}>
                            {formatDigestInstant(item.lastDeliveredUtc)}
                          </span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <span className={OPERATOR_TYPOGRAPHY.helper}>{formatDeliveryResult(attempts)}</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!canMutateSubscriptions}
                              title={
                                canMutateSubscriptions
                                  ? "Editing destinations is not available yet — pause and create a replacement subscription."
                                  : enterpriseMutationControlDisabledTitle
                              }
                              onClick={() => {
                                setName(item.name);
                                setChannelType(item.channelType);
                                setDestination(item.destination);
                                setCreateEnabled(item.isEnabled);
                                focusCreateForm();
                              }}
                            >
                              Edit
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href="/advisory?tab=schedules">Send test</Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void onToggle(item.subscriptionId)}
                              disabled={!canMutateSubscriptions}
                              title={canMutateSubscriptions ? undefined : enterpriseMutationControlDisabledTitle}
                            >
                              {canMutateSubscriptions
                                ? item.isEnabled
                                  ? "Pause"
                                  : "Resume"
                                : item.isEnabled
                                  ? digestSubscriptionsToggleToDisabledReaderRank
                                  : digestSubscriptionsToggleToEnabledReaderRank}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled
                              title="Deleting subscriptions is not available in this release. Pause the subscription to stop delivery."
                            >
                              Delete
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => void onViewHistory(item.subscriptionId)}
                              title={
                                canMutateSubscriptions
                                  ? digestSubscriptionsDeliveryAttemptsButtonTitleOperator
                                  : digestSubscriptionsDeliveryAttemptsButtonTitleReader
                              }
                            >
                              {historyOpenFor === item.subscriptionId
                                ? "Hide delivery history"
                                : canMutateSubscriptions
                                  ? "View delivery history"
                                  : digestSubscriptionsDeliveryAttemptsButtonLabelReaderRank}
                            </Button>
                          </div>
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    );
                  })}
                </EnterpriseTableBody>
              </EnterpriseTable>

              {historyOpenFor !== null && (attemptsBySub[historyOpenFor]?.length ?? 0) > 0 ? (
                <div
                  className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                  data-testid="digest-subscription-delivery-history"
                >
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    Delivery history
                  </h4>
                  <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
                    {(attemptsBySub[historyOpenFor] ?? []).map((a) => (
                      <li key={a.attemptId}>
                        {a.status} · {formatDigestInstant(a.attemptedUtc)}
                        {a.errorMessage ? (
                          <span className="text-rose-700 dark:text-rose-300"> — {a.errorMessage}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {historyOpenFor !== null && (attemptsBySub[historyOpenFor]?.length ?? 0) === 0 ? (
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  No delivery attempts recorded for this subscription yet.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <CollapsibleSection
        title="Technical details"
        defaultOpen={false}
        sectionTestId="digest-subscriptions-technical-details"
      >
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Development-only: local and non-production environments may use simulated email or webhook delivery. Confirm
          outbound transport readiness under Integration readiness before relying on production delivery.
        </p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className="text-al-link underline-offset-2 hover:underline" href="/integrations/readiness">
            Open integration readiness
          </Link>
        </p>
      </CollapsibleSection>
    </div>
  );
}
