"use client";

import {
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { GovernanceConflictsTable } from "@/components/governance/GovernanceConflictsTable";
import { GovernanceResolutionRankCue } from "@/components/EnterpriseControlsContextHints";
import { StandardsRulesGovernanceStatusBanner } from "@/components/governance/StandardsRulesGovernanceStatusBanner";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/governance/GovernanceSetupConfigHubsVocabularyRail";
import { PolicyPacksStandardsVocabularyRail } from "@/components/policy/PolicyPacksStandardsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import {
  governanceResolutionChangeRelatedControlsLead,
  governanceResolutionChangeRelatedControlsReaderSupplement,
  governanceResolutionEffectivePolicyHeadingOperator,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionPageLeadOperator,
  governanceResolutionPageLeadReader,
  governanceResolutionRawOutputAccordionLabel,
  governanceResolutionRefreshButtonTitle,
  governanceResolutionRefreshPolicySectionHeading,
  governanceResolutionResolutionDetailsHeadingOperator,
  governanceResolutionResolutionDetailsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { triggerGovernanceResolutionMarkdownDownload } from "@/lib/governance/governance-resolution-markdown";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  buildStandardsRuleRows,
  buildStandardsRulesSummary,
  collectStandardsRulesFilterOptions,
  EMPTY_STANDARDS_RULES_FILTER_STATE,
  filterStandardsRuleRows,
} from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_PAGE_SUBTITLE,
  STANDARDS_RULES_PAGE_TITLE,
} from "@/lib/standards-rules-page";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import { StandardsRulesEmptyState } from "./StandardsRulesEmptyState";
import { StandardsRulesFilters } from "./StandardsRulesFilters";
import { StandardsRulesSummaryStrip } from "./StandardsRulesSummaryStrip";
import { StandardsRulesTable } from "./StandardsRulesTable";
type Props = {
  readonly model: GovernanceResolutionPageViewModel;
};

function GovernanceResolutionOperatorDiagnostics(props: { readonly model: GovernanceResolutionPageViewModel }) {
  const m = props.model;
  const canMutateEnterprisePolicySurfaces = m.canMutateEnterprisePolicySurfaces;

  return (
    <>
      <section className="mb-7" aria-labelledby="governance-conflicts-heading">
        <h3 id="governance-conflicts-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Policy pack conflicts ({m.data?.conflicts.length ?? 0})
        </h3>
        <p className={cn("mt-1 mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          When multiple assigned packs define the same governance item, the higher-precedence pack wins. Use the table to see
          which pack was selected, why, and open losing packs to change their assignment.
        </p>
        {(m.data?.conflicts ?? []).length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No conflicts detected for the current scope.</p>
        ) : (
          <GovernanceConflictsTable
            conflicts={m.data!.conflicts}
            decisions={m.data!.decisions}
            canEditPolicyPacks={canMutateEnterprisePolicySurfaces}
          />
        )}
      </section>

      <section className="mb-7" aria-labelledby="governance-effective-heading">
        <h3 id="governance-effective-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          <GlossaryTooltip termKey="effective_governance">
            {canMutateEnterprisePolicySurfaces
              ? governanceResolutionEffectivePolicyHeadingOperator
              : governanceResolutionEffectivePolicyHeadingReader}
          </GlossaryTooltip>
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Summary notes</h4>
        <ul className={OPERATOR_TYPOGRAPHY.body}>
          {(m.data?.notes ?? []).length === 0 ? (
            <li className="text-al-text-secondary">—</li>
          ) : (
            m.data!.notes.map((n) => <li key={n}>{n}</li>)
          )}
        </ul>

        <AdvancedOptionsAccordion className="mt-5" triggerLabel={governanceResolutionRawOutputAccordionLabel}>
          <div className="grid gap-4">
            <h4 className={cn("mt-0 mb-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Effective content</h4>
            <pre
              className={cn(
                "m-0 max-h-[400px] overflow-auto bg-neutral-100 p-3 dark:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.micro,
              )}
            >
              {m.data ? JSON.stringify(m.data.effectiveContent, null, 2) : "—"}
            </pre>
            <details className="max-w-3xl">
              <summary className={cn("cursor-pointer font-semibold text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                How packs are ordered (scope, pins, ties)
              </summary>
              <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <strong>Project</strong> wins over <strong>Workspace</strong> over <strong>Tenant</strong>. Pinned beats unpinned at the
                same tier; newest assignment breaks ties. Conflicts surface when definitions disagree.
              </p>
            </details>
          </div>
        </AdvancedOptionsAccordion>
      </section>

      <section className="mb-7" aria-labelledby="governance-resolution-details-heading">
        <h3 id="governance-resolution-details-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {canMutateEnterprisePolicySurfaces
            ? governanceResolutionResolutionDetailsHeadingOperator
            : governanceResolutionResolutionDetailsHeadingReader}
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Resolution decisions ({m.data?.decisions.length ?? 0})
        </h4>
        <div className="grid gap-2.5">
          {(m.data?.decisions ?? []).map((d, i) => (
            <article
              key={`${d.itemType}-${d.itemKey}-${i}`}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-950"
            >
              <div className={OPERATOR_TYPOGRAPHY.cardTitle}>
                <strong>{d.itemType}</strong> <code>{d.itemKey}</code>
              </div>
              <div className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>
                Winner: <strong>{d.winningPolicyPackName}</strong> ({d.winningVersion}) — scope <code>{d.winningScopeLevel}</code>
              </div>
              <div className={cn("mt-1.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{d.resolutionReason}</div>
              <details className={cn("mt-2", OPERATOR_TYPOGRAPHY.micro)}>
                <summary>All candidates</summary>
                <pre className="overflow-auto max-h-[220px]">{JSON.stringify(d.candidates, null, 2)}</pre>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="governance-change-controls-heading"
        className={cn(
          !canMutateEnterprisePolicySurfaces &&
            "rounded-md border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-700/60 dark:bg-neutral-900/35",
        )}
      >
        <h3 id="governance-change-controls-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {governanceResolutionRefreshPolicySectionHeading}
        </h3>
        <p className={cn("mb-2.5 mt-0 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {governanceResolutionChangeRelatedControlsLead}
        </p>
        {!canMutateEnterprisePolicySurfaces ? (
          <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
            {governanceResolutionChangeRelatedControlsReaderSupplement}
          </p>
        ) : null}
        <div className="mb-0 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            title={governanceResolutionRefreshButtonTitle}
            onClick={() => void m.load()}
            disabled={m.loading}
          >
            {m.loading ? "Loading…" : "Refresh"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="governance-resolution-export-markdown"
            title="Download a point-in-time diagnostic report with notes, conflicts, decisions, and effective content"
            disabled={m.loading || m.data === null}
            onClick={() => {
              if (m.data === null) {
                return;
              }

              triggerGovernanceResolutionMarkdownDownload(m.data);
            }}
          >
            Export diagnostic report
          </Button>
        </div>
      </section>
    </>
  );
}

export function GovernanceResolutionPageView(props: Props) {
  const m = props.model;
  const [filters, setFilters] = useState(EMPTY_STANDARDS_RULES_FILTER_STATE);
  const allRuleRows = useMemo(
    () => buildStandardsRuleRows(m.data, { useShowcaseFallback: m.buyerPolishedShell }),
    [m.buyerPolishedShell, m.data],
  );
  const filteredRuleRows = useMemo(() => filterStandardsRuleRows(allRuleRows, filters), [allRuleRows, filters]);
  const summary = useMemo(() => buildStandardsRulesSummary(allRuleRows), [allRuleRows]);
  const filterOptions = useMemo(() => collectStandardsRulesFilterOptions(allRuleRows), [allRuleRows]);

  if (m.buyerPolishedShell) {
    return (
      <div className="w-full max-w-[1440px]">
        <StandardsRulesGovernanceStatusBanner className="mb-3" />
        <OperatorPageHeader
          title={STANDARDS_RULES_PAGE_TITLE}
          subtitle={STANDARDS_RULES_PAGE_SUBTITLE}
          actions={<PageContextualHelpButton />}
        />
        <PolicyPacksStandardsVocabularyRail currentSurfaceId="standards-and-rules" />
        <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="standards" />
        {m.failure !== null ? (
          <div role="alert">
            <OperatorApiProblem
              problem={m.failure.problem}
              fallbackMessage={m.failure.message}
              correlationId={m.failure.correlationId}
            />
          </div>
        ) : null}
        <StandardsRulesSummaryStrip summary={summary} />
        <StandardsRulesFilters
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
          onReset={() => {
            setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
          }}
          onRefresh={() => {
            void m.load();
          }}
          refreshing={m.loading}
        />
        {allRuleRows.length === 0 ? (
          <StandardsRulesEmptyState />
        ) : filteredRuleRows.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No rules match your filters.</p>
        ) : (
          <StandardsRulesTable rows={filteredRuleRows} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <LayerHeader pageKey="governance-resolution" density="compact"
/>
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.governanceResolution}
        subtitle={m.canMutateEnterprisePolicySurfaces ? governanceResolutionPageLeadOperator : governanceResolutionPageLeadReader}
        actions={<PageContextualHelpButton />}
      />
      <PolicyPacksStandardsVocabularyRail currentSurfaceId="standards-and-rules" />
      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="standards" />
      <GovernanceResolutionRankCue className="mb-3" />
      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}
      <GovernanceResolutionOperatorDiagnostics model={m} />
    </div>
  );
}
