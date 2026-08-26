"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AlertRulesContinueLastViewedRow } from "@/components/alerts/AlertRulesContinueLastViewedRow";
import { AlertRuleListRow } from "@/components/alerts/AlertRuleListRow";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
} from "@/components/ui/enterprise-table";
import { Skeleton } from "@/components/ui/skeleton";
import { ALERT_RULES_LIST_HEADING } from "@/lib/alert-rule-conditions-copy";
import { ALERT_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRulesContinueLastTarget } from "@/lib/resolve-continue-last-alert-rule";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import type { AlertRule } from "@/types/alerts";

function AlertRulesListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-3"
      data-testid="alert-rules-list-loading-skeleton"
      aria-busy="true"
      aria-label="Loading alert rules"
    >
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-10 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
    </div>
  );
}

export type AlertRulesTableProps = {
  readonly listInitialLoading: boolean;
  readonly items: readonly AlertRule[];
  readonly continueLastRule: AlertRulesContinueLastTarget | null;
  readonly routingSubscriptions: readonly AlertRoutingSubscription[];
  readonly showEmptyCard: boolean;
  readonly emptyStateDescription: ReactNode;
  readonly emptyStateFooter: ReactNode;
  readonly onOpenRule: (ruleId: string) => void;
  readonly onSimulate: (rule: AlertRule) => void;
};

export function AlertRulesTable(props: AlertRulesTableProps): React.JSX.Element {
  const {
    listInitialLoading,
    items,
    continueLastRule,
    routingSubscriptions,
    showEmptyCard,
    emptyStateDescription,
    emptyStateFooter,
    onOpenRule,
    onSimulate,
  } = props;

  return (
    <>
      {listInitialLoading ? <AlertRulesListLoadingSkeleton /> : null}

      {!listInitialLoading && items.length > 0 ? (
        <section aria-labelledby="alert-rules-list-heading">
          <h2 id="alert-rules-list-heading" className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {ALERT_RULES_LIST_HEADING}
          </h2>

          {continueLastRule !== null ? (
            <AlertRulesContinueLastViewedRow target={continueLastRule} onOpen={onOpenRule} />
          ) : null}

          <EnterpriseTable ariaLabel="Alert rules">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Condition</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Alert priority</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Notifications</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {items.map((rule) => (
                <AlertRuleListRow
                  key={rule.ruleId}
                  rule={rule}
                  routingSubscriptions={routingSubscriptions}
                  onSimulate={onSimulate}
                />
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </section>
      ) : null}

      {showEmptyCard ? (
        <EnterpriseCompactEmptyState
          {...ALERT_RULES_LIST_EMPTY_COMPACT}
          description={emptyStateDescription}
          footer={emptyStateFooter}
        />
      ) : null}
    </>
  );
}
