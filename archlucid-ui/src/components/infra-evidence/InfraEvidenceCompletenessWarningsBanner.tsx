"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusTag } from "@/components/ui/status-tag";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveInfraEvidenceCompletenessWarningPresentation,
  snapshotIncludesTier1AppSettingHosts,
} from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";
import { formatInfraEvidenceCompletenessSummaryBannerLine } from "@/lib/infra-evidence/format-infra-evidence-completeness-summary-banner-line";
import { resolveInfraEvidenceCompletenessBannerLead } from "@/lib/infra-evidence/infra-evidence-completeness-banner-lead";
import { resolveInfraEvidenceCompletenessWarningsStatusTagKind } from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warnings-status-tag-kind";
import type { InfraEvidenceMermaidCompletenessSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

const COMPLETENESS_WARNING_PREVIEW_COUNT = 3;

export type InfraEvidenceCompletenessWarningsBannerProps = {
  /** Undefined when the API omitted warnings; an empty array means stored empty. */
  readonly warnings?: readonly string[] | null;
  readonly summary?: InfraEvidenceMermaidCompletenessSummary | null;
  readonly scopeLine?: string | null;
};

export function InfraEvidenceCompletenessWarningsBanner(
  props: InfraEvidenceCompletenessWarningsBannerProps,
): React.JSX.Element | null {
  if (props.warnings === null || props.warnings === undefined) {
    return (
      <div
        className={cn(DESIGN_TOKENS.callout.neutral, "space-y-2 p-3")}
        data-testid="infra-evidence-completeness-warnings-banner"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Completeness warnings were not stored.</p>
        {props.summary ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            {formatInfraEvidenceCompletenessSummaryBannerLine(props.summary)}
          </p>
        ) : null}
      </div>
    );
  }

  const warnings = props.warnings
    .map((warning) => warning.trim())
    .filter((warning) => warning.length > 0);

  if (warnings.length === 0) {
    return null;
  }

  const tier1HostsIncluded = snapshotIncludesTier1AppSettingHosts(warnings);
  const summary = props.summary;
  const statusKind = resolveInfraEvidenceCompletenessWarningsStatusTagKind(warnings);
  const previewWarnings = warnings.slice(0, COMPLETENESS_WARNING_PREVIEW_COUNT);
  const remainingWarningCount = warnings.length - previewWarnings.length;
  const detailsDefaultOpen = warnings.length <= COMPLETENESS_WARNING_PREVIEW_COUNT;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-2 p-3")}
      data-testid="infra-evidence-completeness-warnings-banner"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind={statusKind}
          label={`${warnings.length} completeness warning${warnings.length === 1 ? "" : "s"}`}
          data-testid="infra-evidence-completeness-warnings-count-tag"
        />
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Inventory completeness warnings
        </p>
      </div>
      {props.scopeLine != null && props.scopeLine.trim().length > 0 ? (
        <p
          className={cn("m-0 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-evidence-completeness-warnings-scope"
        >
          {props.scopeLine}
        </p>
      ) : null}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        {resolveInfraEvidenceCompletenessBannerLead(warnings)}
      </p>
      {summary ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {formatInfraEvidenceCompletenessSummaryBannerLine(summary)}
        </p>
      ) : (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Completeness counts were not stored.</p>
      )}
      {tier1HostsIncluded ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          App setting hostnames are included in this package (values are never collected).
        </p>
      ) : null}
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {previewWarnings.map((warning) => {
          const presentation = resolveInfraEvidenceCompletenessWarningPresentation(warning);

          return (
            <li key={presentation.code}>
              <span className="font-medium text-al-text-primary">{presentation.title}</span>
            </li>
          );
        })}
      </ul>
      <CollapsibleSection
        title={
          remainingWarningCount > 0
            ? `All warning details (${warnings.length})`
            : "Warning details"
        }
        defaultOpen={detailsDefaultOpen}
        sectionTestId="infra-evidence-completeness-warnings-details"
        className="mb-0 border-0 bg-transparent p-0 shadow-none dark:border-0 dark:bg-transparent"
      >
        <ul className={cn("m-0 list-disc space-y-2 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {warnings.map((warning) => {
            const presentation = resolveInfraEvidenceCompletenessWarningPresentation(warning);

            return (
              <li key={presentation.code}>
                <span className="font-medium text-al-text-primary">{presentation.title}</span>
                <span> — {presentation.detail}</span>
              </li>
            );
          })}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
