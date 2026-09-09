import { PageHeading } from "@/components/PageHeading";
import { HelpHubLoadingSkeleton } from "@/components/help/HelpHubLoadingSkeleton";
import { HelpHubBreadcrumb } from "@/components/help/HelpHubBreadcrumb";
import { HELP_HUB_CLAIM_DISCIPLINE } from "@/lib/help/help-hub-evidence-copy";
import {
  HELP_HUB_PAGE_SUBTITLE_BUYER,
  HELP_HUB_PRIMARY_CONTENT_ID,
  HELP_HUB_SKIP_LINK_LABEL,
} from "@/lib/help/help-hub-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Structured navigation shell while the Help Center hub client chunk loads. */
export default function HelpHubLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="help-hub-route-loading">
      <a href={`#${HELP_HUB_PRIMARY_CONTENT_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {HELP_HUB_SKIP_LINK_LABEL}
      </a>
      <div className="mb-4 text-left">
        <HelpHubBreadcrumb />
      </div>
      <PageHeading
        navHref="/help"
        title="Help"
        description={HELP_HUB_PAGE_SUBTITLE_BUYER}
        claimDiscipline={HELP_HUB_CLAIM_DISCIPLINE}
        claimDisciplineTestId="help-hub-claim-discipline"
        bordered
      />
      <HelpHubLoadingSkeleton />
    </div>
  );
}
