import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";

export type SponsorExportSendHonestyStripProps = {
  readonly className?: string;
  readonly testIdPrefix?: string;
};

const SPONSOR_EXPORT_SEND_HONESTY_LINES = [
  SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE,
  FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY,
  POLICY_PACK_INFLUENCE_HONESTY_LINE,
] as const;

const SPONSOR_EXPORT_SEND_HONESTY_LINE_TEST_IDS = [
  "non-summing",
  "disposition",
  "policy-influence",
] as const;

/** Compact non-summing ROI + disposition literacy at sponsor export download CTAs. */
export function SponsorExportSendHonestyStrip({
  className,
  testIdPrefix = "sponsor-export-send",
}: SponsorExportSendHonestyStripProps): React.JSX.Element {
  return (
    <ul
      className={cn(
        "m-0 list-disc space-y-1 pl-5 text-al-text-secondary",
        OPERATOR_TYPOGRAPHY.helper,
        className,
      )}
      data-testid={`${testIdPrefix}-honesty-strip`}
      role="note"
      aria-label="Before you export"
    >
      {SPONSOR_EXPORT_SEND_HONESTY_LINES.map((line, index) => (
        <li
          key={SPONSOR_EXPORT_SEND_HONESTY_LINE_TEST_IDS[index]}
          data-testid={`${testIdPrefix}-${SPONSOR_EXPORT_SEND_HONESTY_LINE_TEST_IDS[index]}`}
        >
          {line}
        </li>
      ))}
    </ul>
  );
}
