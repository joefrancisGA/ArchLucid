"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CompositeAlertRulesContinueLastViewedRow } from "@/components/alerts/CompositeAlertRulesContinueLastViewedRow";
import { Button } from "@/components/ui/button";
import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL,
  COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE,
  COMPOSITE_RULES_EMPTY_EXAMPLE_BODY,
  COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING,
  compositeRulesCreateButtonLabelOperator,
  compositeRulesCurrentRulesHeadingOperator,
  compositeRulesCurrentRulesHeadingReader,
  compositeRulesDefinedListEmptyOperatorLine,
  compositeRulesDefinedListEmptyReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import { COMPOSITE_RULES_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import {
  enterpriseStatusTagClass,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  compositeAlertRuleStatusKind,
  compositeAlertRuleStatusLabel,
  formatCompositeAlertConditionSummary,
  formatCompositeAlertRuleSummary,
} from "@/lib/composite-alert-rules-labels";
import type { CompositeAlertRulesContinueLastTarget } from "@/lib/resolve-continue-last-composite-alert-rule";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

function CompositeAlertRulesListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-3"
      data-testid="composite-alert-rules-list-loading-skeleton"
      aria-busy="true"
      aria-label="Loading composite alert rules"
    >
      <Skeleton className="h-28 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
      <Skeleton className="h-28 w-full rounded-lg border border-neutral-200 dark:border-neutral-700" />
    </div>
  );
}

const COMPOSITE_ALERT_RULE_STATE_CHIP_HINT =
  "Read-only state — composite rules cannot be disabled from this workspace.";

function CompositeAlertRuleStateChip(props: {
  readonly isEnabled: boolean;
  readonly ruleId: string;
}): React.JSX.Element {
  const kind = compositeAlertRuleStatusKind(props.isEnabled);
  const label = compositeAlertRuleStatusLabel(props.isEnabled);

  return (
    <span className="inline-flex items-center gap-1">
      <MetadataStatusLabel
        className={enterpriseStatusTagClass(kind)}
        data-testid={`composite-alert-rule-state-${props.ruleId}`}
        aria-readonly="true"
      >
        {label}
      </MetadataStatusLabel>
      <FieldHelpTooltip label="Rule state" hint={COMPOSITE_ALERT_RULE_STATE_CHIP_HINT} />
    </span>
  );
}

export type CompositeAlertRulesTableProps = {
  readonly canMutateComposite: boolean;
  readonly scopedRunFilterActive: boolean;
  readonly loading: boolean;
  readonly isEmpty: boolean;
  readonly emptyIntroMode: boolean;
  readonly items: readonly CompositeAlertRule[];
  readonly continueLastRule: CompositeAlertRulesContinueLastTarget | null;
  readonly conditionsTabHref: string;
  readonly onRevealCreatePanel: () => void;
  readonly onOpenRule: (ruleId: string) => void;
  readonly onRememberRule: (ruleId: string) => void;
};

export function CompositeAlertRulesTable(props: CompositeAlertRulesTableProps): React.JSX.Element {
  const {
    canMutateComposite,
    scopedRunFilterActive,
    loading,
    isEmpty,
    emptyIntroMode,
    items,
    continueLastRule,
    conditionsTabHref,
    onRevealCreatePanel,
    onOpenRule,
    onRememberRule,
  } = props;

  return (
    <section
      className={cn("min-w-0", !canMutateComposite && "opacity-95")}
      aria-labelledby="composite-rules-current-heading"
    >
      <h3 id="composite-rules-current-heading" className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {canMutateComposite ? compositeRulesCurrentRulesHeadingOperator : compositeRulesCurrentRulesHeadingReader}
      </h3>

      <p
        className={cn("mb-3 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="composite-rules-create-only-disclosure"
      >
        {COMPOSITE_RULES_CREATE_ONLY_DISCLOSURE}
      </p>

      {canMutateComposite && scopedRunFilterActive ? (
        <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="composite-rules-action-row">
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="composite-rules-create-action"
            onClick={onRevealCreatePanel}
          >
            {compositeRulesCreateButtonLabelOperator}
          </Button>
        </div>
      ) : null}

      {continueLastRule !== null && items.length > 0 ? (
        <CompositeAlertRulesContinueLastViewedRow target={continueLastRule} onOpen={onOpenRule} />
      ) : null}

      <div className="grid gap-3.5">
        {loading && items.length === 0 ? (
          <CompositeAlertRulesListLoadingSkeleton />
        ) : emptyIntroMode ? (
          <EnterpriseCompactEmptyState
            {...COMPOSITE_RULES_LIST_EMPTY_COMPACT}
            footer={
              <div className="flex w-full flex-col gap-3">
                <div
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
                  data-testid="composite-rules-empty-example"
                >
                  <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                    {COMPOSITE_RULES_EMPTY_EXAMPLE_HEADING}
                  </p>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {COMPOSITE_RULES_EMPTY_EXAMPLE_BODY}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    data-testid="composite-rules-empty-create-action"
                    onClick={onRevealCreatePanel}
                  >
                    {compositeRulesCreateButtonLabelOperator}
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-neutral-300 dark:border-neutral-600"
                  >
                    <Link
                      href={conditionsTabHref}
                      data-testid="composite-rules-empty-conditions-link"
                    >
                      {COMPOSITE_RULES_CONDITIONS_TAB_LINK_LABEL}
                    </Link>
                  </Button>
                </div>
              </div>
            }
          />
        ) : items.length === 0 ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {canMutateComposite ? compositeRulesDefinedListEmptyOperatorLine : compositeRulesDefinedListEmptyReaderLine}
          </p>
        ) : (
          items.map((r: CompositeAlertRule) => (
            <article
              key={r.compositeRuleId}
              className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
              aria-label={`Composite alert rule ${r.name}`}
              data-testid={`composite-alert-rule-row-${r.compositeRuleId}`}
              data-composite-alert-rule-id={r.compositeRuleId}
              onClick={() => {
                onRememberRule(r.compositeRuleId);
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <strong>{r.name}</strong>
                <CompositeAlertRuleStateChip isEnabled={r.isEnabled} ruleId={r.compositeRuleId} />
              </div>
              <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                <p className="mb-2 text-neutral-600 dark:text-neutral-400">{formatCompositeAlertRuleSummary(r)}</p>
                <ul className="mt-2">
                  {(r.conditions ?? []).map((c) => (
                    <li key={c.conditionId ?? `${c.metricType}-${c.thresholdValue}`}>
                      {formatCompositeAlertConditionSummary(c)}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
