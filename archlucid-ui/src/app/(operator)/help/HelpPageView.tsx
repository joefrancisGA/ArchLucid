"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import { HelpHubBuyerChrome } from "@/components/help/HelpHubBuyerChrome";
import { HelpHubClaimOrientationStrip } from "@/components/help/HelpHubClaimOrientationStrip";
import { HELP_HUB_CLAIM_DISCIPLINE } from "@/lib/help/help-hub-evidence-copy";
import {
  HELP_HUB_BUYER_START_HERE_HELPER,
  HELP_HUB_FIRST_VIEWPORT_TEST_ID,
  HELP_HUB_ORIENTATION_BOTTOM_TEST_ID,
  HELP_HUB_PAGE_SUBTITLE_BUYER,
} from "@/lib/help/help-hub-page-copy";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { howProductWorksTitle } from "@/lib/product-line/product-line-display-name";
import { cn } from "@/lib/utils";

import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpProductGuide } from "./HelpProductGuide";

/** Help Center hub body for `/help` (HEL). */
export function HelpPageView(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { productLine } = useLocalizedProductCopy();
  const howProductWorksLabel = howProductWorksTitle(productLine);

  const richDescription = (
    <>
      Start with the guides below for review workflows and cloud connections. See{" "}
      <Link
        className={OPERATOR_BODY_INLINE_LINK_CLASS}
        href="/help/getting-started#how-archlucid-works"
      >
        {howProductWorksLabel}
      </Link>{" "}
      for the workflow, the{" "}
      <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/faq">
        Product FAQ
      </Link>{" "}
      for evaluation and pricing answers, and{" "}
      <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/help/data-handling">
        data handling
      </Link>{" "}
      for security posture.
    </>
  );

  const heading = (
    <PageHeading
      navHref="/help"
      title="Help"
      description={buyerPolishedShell ? HELP_HUB_PAGE_SUBTITLE_BUYER : richDescription}
      claimDiscipline={HELP_HUB_CLAIM_DISCIPLINE}
      claimDisciplineTestId="help-hub-claim-discipline"
      actions={
        buyerPolishedShell ? undefined : (
          <>
            <PageContextualHelpButton />
            <HelpTourTrigger />
          </>
        )
      }
      bordered
    />
  );

  const buyerFirstViewport = (
    <div
      className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
      data-testid={HELP_HUB_FIRST_VIEWPORT_TEST_ID}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="help-hub-intro">
        {richDescription}
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-hub-buyer-start-here-helper"
      >
        {HELP_HUB_BUYER_START_HERE_HELPER}
      </p>
    </div>
  );

  const guideBody = (
    <>
      {buyerPolishedShell ? buyerFirstViewport : null}
      {buyerPolishedShell ? null : (
        <GlossaryProceduralHelpVocabularyRail currentSurfaceId="help-hub" />
      )}
      {buyerPolishedShell ? null : (
        <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="help-hub" />
      )}
      <HelpProductGuide />
      {buyerPolishedShell ? (
        <div className="mb-4 text-left" data-testid={HELP_HUB_ORIENTATION_BOTTOM_TEST_ID}>
          <HelpHubClaimOrientationStrip />
        </div>
      ) : null}
    </>
  );

  if (buyerPolishedShell) {
    return (
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-page">
        <HelpHubBuyerChrome hero={heading}>{guideBody}</HelpHubBuyerChrome>
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-page">
      {heading}
      {guideBody}
    </OperatorPageContainer>
  );
}
