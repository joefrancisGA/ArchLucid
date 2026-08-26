"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { cn } from "@/lib/utils";

export type PilotScorecardMethodologyProps = {
  readonly methodologyLines: readonly string[];
};

export function PilotScorecardMethodology({ methodologyLines }: PilotScorecardMethodologyProps) {
  return (
    <CollapsibleSection title="How this is calculated" defaultOpen={true} sectionTestId="review-scorecard-methodology">
      <ul className={cn("m-0 list-disc space-y-2 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {methodologyLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>
          ROI estimates apply a 50% review-time reduction lever once all three assumptions are provided.{" "}
          <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={OPERATOR_LINK.inline}>
            See ROI summary
          </Link>{" "}
          for related value reporting.
        </li>
      </ul>
    </CollapsibleSection>
  );
}
