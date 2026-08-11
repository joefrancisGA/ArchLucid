import Link from "next/link";

import { ReportProblemAuditVocabularyRail } from "@/components/ReportProblemAuditVocabularyRail";
import { ReportProblemHelpEvidenceOrientationStrip } from "@/components/help/ReportProblemHelpEvidenceOrientationStrip";
import { ReportProblemSurfaceCoverageTable } from "@/components/help/ReportProblemSurfaceCoverageTable";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";

/** Evidence strip, vocabulary rail, support email, and surface registry for HRE. */
export function ReportProblemHelpOrientationStack(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="report-a-problem-help-orientation-stack">
      <ReportProblemHelpEvidenceOrientationStrip />
      <ReportProblemAuditVocabularyRail currentSurfaceId="report-problem" />
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="report-a-problem-help-support-email"
      >
        Support email (when Report problem is not on the page):{" "}
        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>
          {ARCHLUCID_SUPPORT_EMAIL}
        </Link>
      </p>
      <ReportProblemSurfaceCoverageTable />
    </div>
  );
}
