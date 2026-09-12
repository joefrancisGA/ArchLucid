import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";

export type SponsorExportSendHonestyStripProps = {
  readonly className?: string;
  readonly testIdPrefix?: string;
};

/** Compact non-summing ROI + disposition literacy at sponsor export download CTAs. */
export function SponsorExportSendHonestyStrip({
  className,
  testIdPrefix = "sponsor-export-send",
}: SponsorExportSendHonestyStripProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid={`${testIdPrefix}-honesty-strip`}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-non-summing`}>
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-disposition`}>
        {FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY}
      </p>
      <PolicyPackInfluenceHonestyChip />
    </div>
  );
}
