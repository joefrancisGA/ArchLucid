"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactElement } from "react";

import { useDigestSubscriptionsQuery } from "@/hooks/use-digest-subscriptions-query";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DigestSubscriptionCreateForm } from "@/components/digests/DigestSubscriptionCreateForm";
import { DigestSubscriptionList } from "@/components/digests/DigestSubscriptionList";
import { DigestSubscriptionsReadinessPanel } from "@/components/digests/DigestSubscriptionsReadinessPanel";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createDigestSubscription,
  listSubscriptionDeliveryAttempts,
  toggleDigestSubscription,
} from "@/lib/api";
import { DIGESTS_BROWSE_RECIPIENTS_HELPER } from "@/lib/digests-browse-copy";
import {
  DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION,
  resolveDigestSubscriptionPauseDialogTitle,
} from "@/lib/digest-subscription-pause-copy";
import {
  DIGEST_SUBSCRIPTIONS_PAGE_SUBTITLE,
  DIGEST_SUBSCRIPTIONS_PAGE_TITLE,
  DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_HELP_HREF,
  DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_NOTE,
} from "@/lib/digest-subscriptions-workflow";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const EMPTY_SUBSCRIPTIONS: DigestSubscription[] = [];

export type DigestSubscriptionsContentProps = {
  readonly healthSnap: WeeklyDigestHealthDto | null;
  readonly refreshToken?: number;
};

/**
 * Subscriptions tab: customer-goal delivery workflow for architecture digests (TB-926).
 */
export function DigestSubscriptionsContent(props: DigestSubscriptionsContentProps): ReactElement {
  const canMutateSubscriptions: boolean = useOperateCapability();
  const refreshToken = props.refreshToken ?? 0;
  const subscriptionsQuery = useDigestSubscriptionsQuery();
  const items = subscriptionsQuery.data ?? EMPTY_SUBSCRIPTIONS;
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [prefillFrom, setPrefillFrom] = useState<DigestSubscription | null>(null);
  const [formResetKey, setFormResetKey] = useState<number>(0);
  const [focusCreateToken, setFocusCreateToken] = useState<number>(0);
  const [pendingPause, setPendingPause] = useState<{
    subscriptionId: string;
    subscriptionName: string;
  } | null>(null);
  const loading = subscriptionsQuery.isLoading || mutating;
  const failure =
    mutationFailure ??
    (subscriptionsQuery.isError ? toApiLoadFailure(subscriptionsQuery.error) : null);

  const formCardRef = useRef<HTMLDivElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (refreshToken === 0) {
      return;
    }

    void subscriptionsQuery.refetch();
  }, [refreshToken, subscriptionsQuery.refetch]);

  useEffect(() => {
    if (items.length === 0) {
      setAttemptsBySub({});

      return;
    }

    let canceled = false;

    void (async () => {
      const attemptEntries = await Promise.all(
        items.map(async (item) => {
          try {
            const rows: DigestDeliveryAttempt[] = await listSubscriptionDeliveryAttempts(
              item.subscriptionId,
              30,
            );
            return [item.subscriptionId, rows] as const;
          } catch {
            return [item.subscriptionId, [] as DigestDeliveryAttempt[]] as const;
          }
        }),
      );
      const nextAttempts: Record<string, DigestDeliveryAttempt[]> = {};

      if (canceled) {
        return;
      }

      for (const [subscriptionId, rows] of attemptEntries) {
        nextAttempts[subscriptionId] = rows;
      }

      setAttemptsBySub(nextAttempts);
    })();

    return () => {
      canceled = true;
    };
  }, [items, refreshToken]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  async function onCreate(input: {
    name: string;
    channelType: string;
    destination: string;
    digestType: string;
    isEnabled: boolean;
  }): Promise<void> {
    if (!canMutateSubscriptions || creating) {
      return;
    }

    setCreating(true);
    setCreateSuccess(false);
    setMutationFailure(null);

    try {
      await createDigestSubscription({
        name: input.name,
        channelType: input.channelType,
        destination: input.destination,
        isEnabled: input.isEnabled,
        metadataJson: JSON.stringify({ digestType: input.digestType }),
      });
      setCreateSuccess(true);

      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => {
        setCreateSuccess(false);
      }, 4000);

      await subscriptionsQuery.refetch();
      setMutationFailure(null);
      setPrefillFrom(null);
      setFormResetKey((value) => value + 1);
    } catch (error) {
      setMutationFailure(toApiLoadFailure(error));
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(
    subscriptionId: string,
    isEnabled: boolean,
    subscriptionName: string,
  ): Promise<void> {
    if (!canMutateSubscriptions) {
      return;
    }

    if (isEnabled) {
      setPendingPause({ subscriptionId, subscriptionName });

      return;
    }

    await executeToggle(subscriptionId);
  }

  async function executeToggle(subscriptionId: string): Promise<void> {
    setMutationFailure(null);
    setMutating(true);

    try {
      await toggleDigestSubscription(subscriptionId);
      await subscriptionsQuery.refetch();
      setMutationFailure(null);
    } catch (error) {
      setMutationFailure(toApiLoadFailure(error));
      throw error;
    } finally {
      setMutating(false);
    }
  }

  async function confirmPause(): Promise<void> {
    if (pendingPause === null || mutating) {
      return;
    }

    try {
      await executeToggle(pendingPause.subscriptionId);
      setPendingPause(null);
    } catch {
      // Failure is already on mutationFailure for the page alert.
    }
  }

  async function onViewHistory(subscriptionId: string): Promise<void> {
    setMutationFailure(null);

    try {
      const rows: DigestDeliveryAttempt[] = await listSubscriptionDeliveryAttempts(subscriptionId, 30);
      setAttemptsBySub((previous) => ({ ...previous, [subscriptionId]: rows }));
      setHistoryOpenFor((current) => (current === subscriptionId ? null : subscriptionId));
    } catch (error) {
      setMutationFailure(toApiLoadFailure(error));
    }
  }

  function focusCreateForm(): void {
    setPrefillFrom(null);
    setFocusCreateToken((value) => value + 1);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onPrefillCreate(subscription: DigestSubscription): void {
    setPrefillFrom(subscription);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="w-full max-w-[1400px] space-y-4" data-testid="digest-subscriptions-content">
      <div>
        <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {DIGEST_SUBSCRIPTIONS_PAGE_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {DIGEST_SUBSCRIPTIONS_PAGE_SUBTITLE}
        </p>
        {/* Two recipient systems exist; say so where an operator is adding one. */}
        <p
          className={cn("m-0 mt-1 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-subscriptions-recipients-clarification"
        >
          {DIGESTS_BROWSE_RECIPIENTS_HELPER}
        </p>
      </div>

      <p
        className={cn(
          "m-0 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="digest-subscriptions-privacy-note"
      >
        {DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_NOTE}{" "}
        <Link className="text-al-link underline-offset-2 hover:underline" href={DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_HELP_HREF}>
          Learn how tenant data is handled
        </Link>
        .
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

      <DigestSubscriptionsReadinessPanel
        healthSnap={props.healthSnap}
        subscriptions={items}
        onAddDeliveryDestination={focusCreateForm}
      />

      <div ref={formCardRef} className="grid gap-4">
        <DigestSubscriptionCreateForm
          key={`digest-create-${formResetKey}`}
          existingSubscriptions={items}
          prefillFrom={prefillFrom}
          canMutate={canMutateSubscriptions}
          collapsedByDefault={items.length > 0}
          creating={creating}
          createSuccess={createSuccess}
          focusRequestToken={focusCreateToken}
          onCreate={onCreate}
        />

        <DigestSubscriptionList
          items={items}
          attemptsBySub={attemptsBySub}
          historyOpenFor={historyOpenFor}
          loading={loading}
          canMutate={canMutateSubscriptions}
          canRevealDestinations={canMutateSubscriptions}
          onRefresh={() => void subscriptionsQuery.refetch()}
          onToggle={(subscriptionId, isEnabled, subscriptionName) =>
            void onToggle(subscriptionId, isEnabled, subscriptionName)
          }
          onViewHistory={(subscriptionId) => void onViewHistory(subscriptionId)}
          onPrefillCreate={onPrefillCreate}
          onFocusCreateForm={focusCreateForm}
        />
      </div>

      <ConfirmationDialog
        open={pendingPause !== null}
        onOpenChange={(open) => {
          if (!open && !mutating) {
            setPendingPause(null);
          }
        }}
        title={resolveDigestSubscriptionPauseDialogTitle(pendingPause?.subscriptionName ?? "")}
        description={DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION}
        confirmLabel="Pause delivery"
        variant="destructive"
        busy={mutating}
        onConfirm={() => {
          void confirmPause();
        }}
      />
    </div>
  );
}
