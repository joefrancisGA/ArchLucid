"use client";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { GovernanceConflictsTable } from "@/components/governance/GovernanceConflictsTable";
import { GovernanceResolutionRankCue } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  governanceResolutionChangeRelatedControlsLead,
  governanceResolutionChangeRelatedControlsReaderSupplement,
  governanceResolutionEffectivePolicyHeadingOperator,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionPageLeadOperator,
  governanceResolutionPageLeadReader,
  governanceResolutionRefreshButtonTitle,
  governanceResolutionResolutionDetailsHeadingOperator,
  governanceResolutionResolutionDetailsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { triggerGovernanceResolutionMarkdownDownload } from "@/lib/governance-resolution-markdown";
import { cn } from "@/lib/utils";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

type Props = {
  readonly model: GovernanceResolutionPageViewModel;
};

export function GovernanceResolutionPageView(props: Props) {
  const m = props.model;
  const canMutateEnterprisePolicySurfaces = m.canMutateEnterprisePolicySurfaces;

  return (
    <div className="max-w-6xl">
      <LayerHeader pageKey="governance-resolution" density="compact" />
      <OperatorPageHeader
        title="Governance resolution"
        subtitle={canMutateEnterprisePolicySurfaces ? governanceResolutionPageLeadOperator : governanceResolutionPageLeadReader}
      />
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

      <section className="mb-7" aria-labelledby="governance-conflicts-heading">
        <h3 id="governance-conflicts-heading" className="text-sm font-semibold text-al-text-primary">
          Policy pack conflicts ({m.data?.conflicts.length ?? 0})
        </h3>
        <p className="mt-1 mb-3 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          When multiple assigned packs define the same governance item, the higher-precedence pack wins. Use the table to see
          which pack was selected, why, and open losing packs to change their assignment.
        </p>
        {(m.data?.conflicts ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No conflicts detected for the current scope.</p>
        ) : (
          <GovernanceConflictsTable
            conflicts={m.data!.conflicts}
            decisions={m.data!.decisions}
            canEditPolicyPacks={canMutateEnterprisePolicySurfaces}
          />
        )}
      </section>

      <section className="mb-7" aria-labelledby="governance-effective-heading">
        <h3 id="governance-effective-heading">
          <GlossaryTooltip termKey="effective_governance">
            {canMutateEnterprisePolicySurfaces
              ? governanceResolutionEffectivePolicyHeadingOperator
              : governanceResolutionEffectivePolicyHeadingReader}
          </GlossaryTooltip>
        </h3>
        <h4 className="mt-2 mb-2 text-base">Summary notes</h4>
        <ul className="text-sm">
          {(m.data?.notes ?? []).length === 0 ? (
            <li className="text-neutral-500 dark:text-neutral-400">—</li>
          ) : (
            m.data!.notes.map((n) => <li key={n}>{n}</li>)
          )}
        </ul>

        <AdvancedOptionsAccordion className="mt-5">
          <div className="grid gap-4">
            <h4 className="mt-0 mb-0 text-sm font-semibold text-al-text-primary">Effective content</h4>
            <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 overflow-auto text-xs max-h-[400px] m-0">
              {m.data ? JSON.stringify(m.data.effectiveContent, null, 2) : "—"}
            </pre>
            <details className="max-w-3xl">
              <summary className="cursor-pointer text-neutral-600 dark:text-neutral-400 text-sm font-semibold">
                How packs are ordered (scope, pins, ties)
              </summary>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
                <strong>Project</strong> wins over <strong>Workspace</strong> over <strong>Tenant</strong>. Pinned beats unpinned at the
                same tier; newest assignment breaks ties. Conflicts surface when definitions disagree.
              </p>
            </details>
          </div>
        </AdvancedOptionsAccordion>
      </section>

      <AdvancedOptionsAccordion className="mb-7">
        <section className="mb-0" aria-labelledby="governance-resolution-details-heading">
          <h3 id="governance-resolution-details-heading" className="mt-0 text-sm font-semibold text-al-text-primary">
            {canMutateEnterprisePolicySurfaces
              ? governanceResolutionResolutionDetailsHeadingOperator
              : governanceResolutionResolutionDetailsHeadingReader}
          </h3>
          <h4 className="mt-0 mb-2 text-base">Resolution decisions ({m.data?.decisions.length ?? 0})</h4>
          <div className="grid gap-2.5">
            {(m.data?.decisions ?? []).map((d, i) => (
              <article
                key={`${d.itemType}-${d.itemKey}-${i}`}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-950"
              >
                <div className="text-[15px]">
                  <strong>{d.itemType}</strong> <code>{d.itemKey}</code>
                </div>
                <div className="text-[13px] mt-1.5">
                  Winner: <strong>{d.winningPolicyPackName}</strong> ({d.winningVersion}) — scope <code>{d.winningScopeLevel}</code>
                </div>
                <div className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-1.5">{d.resolutionReason}</div>
                <details className="mt-2 text-xs">
                  <summary>All candidates</summary>
                  <pre className="overflow-auto max-h-[220px]">{JSON.stringify(d.candidates, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        </section>
      </AdvancedOptionsAccordion>

      <section
        aria-labelledby="governance-change-controls-heading"
        className={cn(
          !canMutateEnterprisePolicySurfaces &&
            "rounded-md border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-700/60 dark:bg-neutral-900/35",
        )}
      >
        <h3 id="governance-change-controls-heading">Change related controls</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-[13px] max-w-2xl mt-0 mb-2.5">
          {governanceResolutionChangeRelatedControlsLead}
        </p>
        {!canMutateEnterprisePolicySurfaces ? (
          <p className="mb-2 max-w-prose text-xs text-neutral-500 dark:text-neutral-400" role="note">
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
            title="Download a point-in-time Markdown snapshot of notes, conflicts, decisions, and effective content"
            disabled={m.loading || m.data === null}
            onClick={() => {
              if (m.data === null) {
                return;
              }

              triggerGovernanceResolutionMarkdownDownload(m.data);
            }}
          >
            Export to Markdown
          </Button>
        </div>
      </section>
    </div>
  );
}
