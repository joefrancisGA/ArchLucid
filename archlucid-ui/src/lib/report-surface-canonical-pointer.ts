import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export type ReportSurfaceCanonicalPointer = {
  readonly surfaceLabel: string;
  readonly body: string;
  readonly canonicalHref: string;
  readonly canonicalLabel: string;
};

const REPORT_SURFACE_CANONICAL_POINTERS: Readonly<Record<string, ReportSurfaceCanonicalPointer>> = {
  "architecture-scorecard": {
    surfaceLabel: "Architecture scorecard",
    body: "Per-review quality and operational KPIs for one finalized package.",
    canonicalHref: SPONSOR_REPORT_PATH,
    canonicalLabel: "Sponsor report",
  },
  "roi-summary": {
    surfaceLabel: "ROI summary",
    body: "Hourly-cost and savings math for a selected review period.",
    canonicalHref: SPONSOR_REPORT_PATH,
    canonicalLabel: "Sponsor report",
  },
  "sponsor-dashboard": {
    surfaceLabel: "Sponsor dashboard",
    body: "Live portfolio KPIs and exports across finalized reviews.",
    canonicalHref: SPONSOR_REPORT_PATH,
    canonicalLabel: "Sponsor report",
  },
  "sponsor-report": {
    surfaceLabel: "Sponsor report",
    body: "Period rollup for sponsors and procurement.",
    canonicalHref: ARCHITECTURE_SCORECARD_PATH,
    canonicalLabel: "Architecture scorecard",
  },
};

export function resolveReportSurfaceCanonicalPointer(
  surfaceId: string,
): ReportSurfaceCanonicalPointer | null {
  return REPORT_SURFACE_CANONICAL_POINTERS[surfaceId] ?? null;
}

export const REPORT_SURFACE_CANONICAL_POINTER_TEST_ID = "report-surface-canonical-pointer";
