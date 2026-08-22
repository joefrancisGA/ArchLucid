import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  governanceResolutionChangeRelatedControlsLead,
  governanceResolutionChangeRelatedControlsReaderSupplement,
  governanceResolutionRefreshPolicySectionHeading,
} from "@/lib/enterprise-controls-context-copy";
import { triggerGovernanceResolutionMarkdownDownload } from "@/lib/governance/governance-resolution-markdown";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";
import { STANDARDS_RULES_EXPORT_RULES_LABEL } from "@/lib/standards-rules-page";
import { triggerStandardsRulesCsvDownload } from "@/lib/standards-rules-csv-export";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

type GovernanceResolutionExportControlsProps = {
  readonly model: GovernanceResolutionPageViewModel;
  readonly compact?: boolean;
  readonly exportRows?: readonly StandardsRuleRow[];
};

/** Refresh + export controls shared by full and buyer-polished standards & rules shells. */
export function GovernanceResolutionExportControls(
  props: GovernanceResolutionExportControlsProps,
): React.ReactElement {
  const m = props.model;
  const canMutateEnterprisePolicySurfaces = m.canMutateEnterprisePolicySurfaces;
  const compact = props.compact === true;
  const exportRows = props.exportRows ?? [];
  const canExportRules = exportRows.length > 0;

  return (
    <section
      aria-labelledby="governance-change-controls-heading"
      className={cn(
        compact ? "mb-4" : "mb-7",
        !canMutateEnterprisePolicySurfaces &&
          !compact &&
          "rounded-md border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-700/60 dark:bg-neutral-900/35",
      )}
    >
      <h3
        id="governance-change-controls-heading"
        className={cn(compact ? "sr-only" : undefined, OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {governanceResolutionRefreshPolicySectionHeading}
      </h3>
      {!compact ? (
        <p className={cn("mb-2.5 mt-0 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {governanceResolutionChangeRelatedControlsLead}
        </p>
      ) : null}
      {!canMutateEnterprisePolicySurfaces && !compact ? (
        <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
          {governanceResolutionChangeRelatedControlsReaderSupplement}
        </p>
      ) : null}
      <div className={cn("flex flex-wrap gap-2", compact ? "mt-0" : "mb-0")}>
        {!compact ? <RefreshButton busy={m.loading} onClick={() => void m.load()} /> : null}
        {compact ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="governance-resolution-export-rules"
            disabled={!canExportRules}
            onClick={() => {
              triggerStandardsRulesCsvDownload(exportRows);
            }}
          >
            {STANDARDS_RULES_EXPORT_RULES_LABEL}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="governance-resolution-export-markdown"
            aria-label="Download a point-in-time diagnostic report with notes, conflicts, decisions, and effective content"
            disabled={m.loading || m.data === null}
            aria-describedby={m.data === null && !m.loading ? "governance-resolution-export-disabled-hint" : undefined}
            onClick={() => {
              if (m.data === null) {
                return;
              }

              triggerGovernanceResolutionMarkdownDownload(m.data);
            }}
          >
            Export diagnostic report
          </Button>
        )}
      </div>
      {m.data === null && !m.loading && !compact ? (
        <p
          id="governance-resolution-export-disabled-hint"
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        >
          Refresh policy resolution data before exporting a diagnostic report.
        </p>
      ) : null}
    </section>
  );
}
