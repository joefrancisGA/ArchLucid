"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveInfraEvidenceCompletenessWarningPresentation,
  snapshotIncludesTier1AppSettingHosts,
} from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";
import { formatInfraEvidenceCompletenessSummaryBannerLine } from "@/lib/infra-evidence/format-infra-evidence-completeness-summary-banner-line";
import type { InfraEvidenceMermaidCompletenessSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

export type InfraEvidenceCompletenessWarningsBannerProps = {
  readonly warnings: readonly string[];
  readonly summary?: InfraEvidenceMermaidCompletenessSummary | null;
};

export function InfraEvidenceCompletenessWarningsBanner(
  props: InfraEvidenceCompletenessWarningsBannerProps,
): React.JSX.Element | null {
  const warnings = props.warnings
    .map((warning) => warning.trim())
    .filter((warning) => warning.length > 0);

  if (warnings.length === 0) {
    return null;
  }

  const tier1HostsIncluded = snapshotIncludesTier1AppSettingHosts(warnings);
  const summary = props.summary;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-2 p-3")}
      data-testid="infra-evidence-completeness-warnings-banner"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Inventory completeness warnings ({warnings.length})
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        These warnings do not block rendering. Connection lines may be missing or weaker than the underlying authorization facts.
      </p>
      {summary ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {formatInfraEvidenceCompletenessSummaryBannerLine(summary)}
        </p>
      ) : null}
      {tier1HostsIncluded ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          App setting hostnames are included in this package (values are never collected).
        </p>
      ) : null}
      <CollapsibleSection
        title="Warning details"
        defaultOpen={warnings.length <= 3}
        sectionTestId="infra-evidence-completeness-warnings-details"
        // The shared disclosure is its own card. Flatten it so the note stays one surface.
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
