"use client";

import { ExecutiveScorecardEvidenceOrientationStrip } from "@/app/(executive)/executive/scorecard/_sections/ExecutiveScorecardEvidenceOrientationStrip";
import { ExecutivePageHeader } from "@/components/executive/ExecutivePageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

type ExecutiveScorecardEvidenceChromeProps = {
  readonly title: string;
  readonly lead?: string | null;
};

/** Header + Category-1 help + Sources strip shared across scorecard load states. */
export function ExecutiveScorecardEvidenceChrome(
  props: ExecutiveScorecardEvidenceChromeProps,
): React.JSX.Element {
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <ExecutivePageHeader title={props.title} lead={props.lead} />
        </div>
        <PageContextualHelpButton />
      </div>
      <ExecutiveScorecardEvidenceOrientationStrip />
    </>
  );
}
