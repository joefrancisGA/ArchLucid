"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { DigestSubscriptionCreateForm } from "@/components/digests/DigestSubscriptionCreateForm";
import { DigestSubscriptionList } from "@/components/digests/DigestSubscriptionList";
import { DigestSubscriptionsReadinessPanel } from "@/components/digests/DigestSubscriptionsReadinessPanel";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createDigestSubscription,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
  toggleDigestSubscription,
} from "@/lib/api";
import { DIGESTS_BROWSE_RECIPIENTS_HELPER } from "@/lib/digests-browse-copy";
import {
  DIGEST_SUBSCRIPTIONS_PAGE_SUBTITLE,
  DIGEST_SUBSCRIPTIONS_PAGE_TITLE,
  DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_HELP_HREF,
  DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_NOTE,
} from "@/lib/digest-subscriptions-workflow";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type DigestSubscriptionsContentProps = {
  readonly healthSnap: WeeklyDigestHealthDto | null;
  readonly refreshToken?: number;
};

/**
 * Subscriptions tab: customer-goal delivery workflow for architecture digests (TB-926).
 */
export function DigestSubscriptionsContent(props: DigestSubscriptionsContentProps): ReactElement {
  const canMutateSubscriptions: boolean = useOperateCapability();
  const [items, setItems] = useState<DigestSubscription[]>([]);
  const [attemptsBySub, setAttemptsBySub] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [prefillFrom, setPrefillFrom] = useState<DigestSubscription | null>(null);
  const [formResetKey, setFormResetKey] = useState<number>(0);

  const formCardRef = useRef<HTMLDivElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data: DigestSubscription[] = await listDigestSubscriptions();
      setItems(data);

      const attemptEntries = await Promise.all(
        data.map(async (item) => {
          try {
            const rows: DigestDeliveryAttempt[] = await listSubscriptionDeliveryAttempts(item.subscriptionId, 30);
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
    } catch (error) {
      setFailure(toApiLoadFailure(error));
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
  }, [load, props.refreshToken]);

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
    setFailure(null);

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

      await load();
      setPrefillFrom(null);
      setFormResetKey((value) => value + 1);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
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
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    }
  }

  async function onViewHistory(subscriptionId: string): Promise<void> {
    setFailure(null);

    try {
      const rows: DigestDeliveryAttempt[] = await listSubscriptionDeliveryAttempts(subscriptionId, 30);
      setAttemptsBySub((previous) => ({ ...previous, [subscriptionId]: rows }));
      setHistoryOpenFor((current) => (current === subscriptionId ? null : subscriptionId));
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    }
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

      <DigestSubscriptionsReadinessPanel healthSnap={props.healthSnap} subscriptions={items} />

      <div ref={formCardRef} className="grid gap-4">
        <DigestSubscriptionCreateForm
          key={`digest-create-${formResetKey}`}
          existingSubscriptions={items}
          prefillFrom={prefillFrom}
          canMutate={canMutateSubscriptions}
          collapsedByDefault={items.length > 0}
          creating={creating}
          createSuccess={createSuccess}
          onCreate={onCreate}
        />

        <DigestSubscriptionList
          items={items}
          attemptsBySub={attemptsBySub}
          historyOpenFor={historyOpenFor}
          loading={loading}
          canMutate={canMutateSubscriptions}
          canRevealDestinations={canMutateSubscriptions}
          onRefresh={() => void load()}
          onToggle={(subscriptionId) => void onToggle(subscriptionId)}
          onViewHistory={(subscriptionId) => void onViewHistory(subscriptionId)}
          onPrefillCreate={onPrefillCreate}
        />
      </div>
    </div>
  );
}
