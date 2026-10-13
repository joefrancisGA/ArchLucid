"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { cn } from "@/lib/utils";

export type SponsorExportSendHonestyStripProps = {
  readonly className?: string;
  readonly testIdPrefix?: string;
};

type SponsorExportSendHonestyEntry = {
  readonly line: string;
  readonly testIdSuffix: "non-summing" | "disposition" | "policy-influence";
};

const SPONSOR_EXPORT_SEND_HONESTY_ENTRIES: readonly SponsorExportSendHonestyEntry[] = [
  { line: SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE, testIdSuffix: "non-summing" },
  { line: FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY, testIdSuffix: "disposition" },
  { line: POLICY_PACK_INFLUENCE_HONESTY_LINE, testIdSuffix: "policy-influence" },
];

/** SecureNow exports omit sponsor ROI headline math — inventory and advisory artifacts are not sponsor ROI surfaces. */
export function resolveSponsorExportSendHonestyEntries(
  productLineId: ProductLineId,
): readonly SponsorExportSendHonestyEntry[] {
  if (isSecureNowProductLine(productLineId)) {
    return SPONSOR_EXPORT_SEND_HONESTY_ENTRIES.filter((entry) => entry.testIdSuffix !== "non-summing");
  }

  return SPONSOR_EXPORT_SEND_HONESTY_ENTRIES;
}

/** Compact non-summing ROI + disposition literacy at sponsor export download CTAs. */
export function SponsorExportSendHonestyStrip({
  className,
  testIdPrefix = "sponsor-export-send",
}: SponsorExportSendHonestyStripProps): React.JSX.Element {
  const { productLine } = useProductLine();
  const entries = resolveSponsorExportSendHonestyEntries(productLine);

  return (
    <div
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, className)}
      data-testid={`${testIdPrefix}-honesty-strip`}
      role="note"
      aria-label="Before you export"
    >
      <ul className="m-0 list-disc space-y-1 pl-5">
        {entries.map((entry) => (
          <li
            key={entry.testIdSuffix}
            data-testid={`${testIdPrefix}-${entry.testIdSuffix}`}
          >
            {entry.line}
          </li>
        ))}
      </ul>
    </div>
  );
}
