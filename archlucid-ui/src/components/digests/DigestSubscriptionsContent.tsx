"use client";

import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useRef, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { DigestsHubNextReviewFooterClient } from "@/components/digests/DigestsHubNextReviewFooterClient";
import { DigestSubscriptionCreateForm } from "@/components/digests/DigestSubscriptionCreateForm";
import { DigestSubscriptionList } from "@/components/digests/DigestSubscriptionList";
import { DigestSubscriptionsContinueLastViewedRow } from "@/components/digests/DigestSubscriptionsContinueLastViewedRow";
import { DigestSubscriptionsPickReviewBeforeCreatingStrip } from "@/components/digests/DigestSubscriptionsPickReviewBeforeCreatingStrip";
import { DigestSubscriptionsReadinessPanel } from "@/components/digests/DigestSubscriptionsReadinessPanel";
import { useDigestSubscriptionsContentCreate } from "@/components/digests/use-digest-subscriptions-content-create";
import { useDigestSubscriptionsContentList } from "@/components/digests/use-digest-subscriptions-content-list";
import { useDigestSubscriptionsContentToggle } from "@/components/digests/use-digest-subscriptions-content-toggle";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { DIGESTS_BROWSE_RECIPIENTS_HELPER } from "@/lib/digests-browse-copy";
import { digestsHubScopedHref } from "@/lib/digests-route-paths";
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
import {
  resolveDigestSubscriptionsWorkflowEmphasizedStepId,
  resolveDigestSubscriptionsWorkflowSteps,
} from "@/lib/digest-subscriptions-workflow-checklist";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type DigestSubscriptionsContentProps = {
  readonly healthSnap: WeeklyDigestHealthDto | null;
  readonly refreshToken?: number;
  readonly scopedRunId?: string | null;
  readonly onPickReview?: (reviewId: string) => void;
};

/**
 * Subscriptions tab: customer-goal delivery workflow for architecture digests (TB-926).
 */
export function DigestSubscriptionsContent(props: DigestSubscriptionsContentProps): ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const refreshToken = props.refreshToken ?? 0;
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const list = useDigestSubscriptionsContentList({ refreshToken });
  const create = useDigestSubscriptionsContentCreate({ list, formCardRef });
  const toggle = useDigestSubscriptionsContentToggle({ list });

  const scopedRunId = (props.scopedRunId ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const requiresReviewPick = props.onPickReview !== undefined && !buyerPolishedShell;
  const createFormVisible = scopedRunFilterActive || !requiresReviewPick;
  const subscriptionsClearScopeHref = digestsHubScopedHref("subscriptions", null);
  const loading = list.loading || toggle.mutating;
  const failure =
    toggle.mutationFailure ??
    create.mutationFailure ??
    list.listFailure ??
    list.queryFailure;
  const subscriptionWorkflowInput = {
    reviewPicked: scopedRunFilterActive,
    destinationConfigured: list.items.length > 0,
    subscriptionEnabled: list.items.some((item) => item.isEnabled),
  };
  const subscriptionWorkflowSteps =
    scopedRunFilterActive && createFormVisible
      ? resolveDigestSubscriptionsWorkflowSteps(subscriptionWorkflowInput)
      : [];
  const subscriptionWorkflowEmphasizedStepId = resolveDigestSubscriptionsWorkflowEmphasizedStepId(
    subscriptionWorkflowInput,
  );

  return (
    <div className={cn(operatorPageContainerClass("dashboard"), "space-y-4")} data-testid="digest-subscriptions-content">
      <div>
        <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {DIGEST_SUBSCRIPTIONS_PAGE_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {DIGEST_SUBSCRIPTIONS_PAGE_SUBTITLE}
        </p>
        {buyerPolishedShell ? null : (
          <p
            className={cn("m-0 mt-1 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="digest-subscriptions-recipients-clarification"
          >
            {DIGESTS_BROWSE_RECIPIENTS_HELPER}
          </p>
        )}
      </div>

      {buyerPolishedShell ? null : (
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
      )}

      {!scopedRunFilterActive && requiresReviewPick ? (
        <DigestSubscriptionsPickReviewBeforeCreatingStrip
          selectedReviewId=""
          onSelectReview={props.onPickReview!}
        />
      ) : scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="digest-subscriptions-run-scope-banner"
        >
          {"Creating subscriptions for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={subscriptionsClearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {subscriptionWorkflowSteps.length > 0 ? (
        <IntegrationConnectChecklist
          title="Subscription checklist"
          steps={subscriptionWorkflowSteps}
          emphasizedStepId={subscriptionWorkflowEmphasizedStepId}
          testIdPrefix="digest-subscriptions-workflow"
        />
      ) : null}

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
        subscriptions={list.items}
        onAddDeliveryDestination={create.focusCreateForm}
      />

      <div ref={formCardRef} className="grid gap-4">
        {createFormVisible ? (
          <DigestSubscriptionCreateForm
            key={`digest-create-${create.formResetKey}`}
            existingSubscriptions={list.items}
            prefillFrom={create.prefillFrom}
            canMutate={create.canMutateSubscriptions}
            collapsedByDefault={list.items.length > 0}
            creating={create.creating}
            createSuccess={create.createSuccess}
            focusRequestToken={create.focusCreateToken}
            onCreate={create.onCreate}
          />
        ) : null}

        {list.continueLastSubscription !== null ? (
          <DigestSubscriptionsContinueLastViewedRow
            target={list.continueLastSubscription}
            onOpen={list.openSubscription}
          />
        ) : null}

        <DigestSubscriptionList
          items={list.items}
          attemptsBySub={list.attemptsBySub}
          historyOpenFor={list.historyOpenFor}
          loading={loading}
          canMutate={toggle.canMutateSubscriptions}
          canRevealDestinations={toggle.canMutateSubscriptions}
          onRefresh={() => void list.subscriptionsQuery.refetch()}
          onToggle={(subscriptionId, isEnabled, subscriptionName) =>
            void toggle.onToggle(subscriptionId, isEnabled, subscriptionName)
          }
          onViewHistory={(subscriptionId) => void list.onViewHistory(subscriptionId)}
          onPrefillCreate={create.onPrefillCreate}
          onFocusCreateForm={create.focusCreateForm}
        />
      </div>

      {scopedRunFilterActive ? (
        <DigestsHubNextReviewFooterClient
          runId={scopedRunId}
          tab="subscriptions"
          title="Next review digest subscriptions"
          actionLabel="Create next subscriptions"
          ariaLabel="Next review digest subscriptions"
          testIdPrefix="digest-subscriptions"
        />
      ) : null}

      <ConfirmationDialog
        open={toggle.pendingPause !== null}
        onOpenChange={(open) => {
          if (!open && !toggle.mutating) {
            toggle.setPendingPause(null);
          }
        }}
        title={resolveDigestSubscriptionPauseDialogTitle(toggle.pendingPause?.subscriptionName ?? "")}
        description={DIGEST_SUBSCRIPTION_PAUSE_DIALOG_DESCRIPTION}
        confirmLabel="Pause delivery"
        variant="destructive"
        busy={toggle.mutating}
        onConfirm={() => {
          void toggle.confirmPause();
        }}
      />
    </div>
  );
}
