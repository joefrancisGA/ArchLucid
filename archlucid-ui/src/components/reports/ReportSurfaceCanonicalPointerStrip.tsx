import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REPORT_SURFACE_CANONICAL_POINTER_TEST_ID,
  resolveReportSurfaceCanonicalPointer,
} from "@/lib/report-surface-canonical-pointer";
import { cn } from "@/lib/utils";

export type ReportSurfaceCanonicalPointerStripProps = {
  readonly surfaceId: string;
};

/** One-line canonical sibling pointer for overlapping report pages (CD-09). */
export function ReportSurfaceCanonicalPointerStrip(
  props: ReportSurfaceCanonicalPointerStripProps,
): React.JSX.Element | null {
  const pointer = resolveReportSurfaceCanonicalPointer(props.surfaceId);

  if (pointer === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={REPORT_SURFACE_CANONICAL_POINTER_TEST_ID}
    >
      {pointer.surfaceLabel} is for {pointer.body} For the merged period view, use{" "}
      <Link href={pointer.canonicalHref} className={OPERATOR_LINK.inline}>
        {pointer.canonicalLabel}
      </Link>
      .
    </p>
  );
}
