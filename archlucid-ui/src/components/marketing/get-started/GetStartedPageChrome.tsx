import type { ReactNode } from "react";

import { GetStartedEvidenceOrientationStrip } from "@/components/marketing/GetStartedEvidenceOrientationStrip";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { GET_STARTED_PRIMARY_CONTENT_ID } from "@/app/(marketing)/get-started/get-started-content";
import {
  GET_STARTED_FIRST_VIEWPORT_ID,
  GET_STARTED_SKIP_LINK_LABEL,
  GET_STARTED_SKIP_TARGET_ID,
} from "@/lib/get-started-page-copy";
import { GET_STARTED_ORIENTATION_SOURCES, GET_STARTED_SCOPE_DISCLOSURE_BODY } from "@/lib/get-started-evidence-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

type GetStartedPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/get-started` — skip link, hero, first-viewport orientation, body (GXX). */
export function GetStartedPageChrome(props: GetStartedPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${GET_STARTED_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {GET_STARTED_SKIP_LINK_LABEL}
      </a>

      <div
        id={GET_STARTED_PRIMARY_CONTENT_ID}
        data-testid="get-started-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {hero}

        <div
          id={GET_STARTED_FIRST_VIEWPORT_ID}
          data-testid={GET_STARTED_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-12 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <div data-testid="get-started-orientation-top">
            <PageHeaderClaimDiscipline
              text={GET_STARTED_SCOPE_DISCLOSURE_BODY}
              testId="get-started-claim-discipline"
              className="max-w-prose text-left"
            />
            <GetStartedEvidenceOrientationStrip placement="top" sources={GET_STARTED_ORIENTATION_SOURCES} />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
