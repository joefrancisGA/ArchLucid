"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveInfraEvidenceCompletenessWarningPresentation,
  snapshotIncludesTier1AppSettingHosts,
} from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";

export type InfraEvidenceCompletenessWarningsBannerProps = {
  readonly warnings: readonly string[];
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

  return (
    <div
      className="space-y-2 rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/60 dark:bg-amber-950/20"
      data-testid="infra-evidence-completeness-warnings-banner"
    >
      <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        Inventory completeness warnings ({warnings.length})
      </p>
      <p className={cn("m-0 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.helper)}>
        These warnings do not block rendering. Connection lines may be missing or weaker than the underlying authorization facts.
      </p>
      {tier1HostsIncluded ? (
        <p className={cn("m-0 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.helper)}>
          App setting hostnames are included in this package (values are never collected).
        </p>
      ) : null}
      <CollapsibleSection
        title="Warning details"
        defaultOpen={warnings.length <= 3}
        sectionTestId="infra-evidence-completeness-warnings-details"
      >
        <ul className={cn("m-0 list-disc space-y-2 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {warnings.map((warning) => {
            const presentation = resolveInfraEvidenceCompletenessWarningPresentation(warning);

            return (
              <li key={presentation.code}>
                <span className="font-medium text-amber-950 dark:text-amber-50">{presentation.title}</span>
                <span className="text-amber-900/90 dark:text-amber-100/90"> — {presentation.detail}</span>
              </li>
            );
          })}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
