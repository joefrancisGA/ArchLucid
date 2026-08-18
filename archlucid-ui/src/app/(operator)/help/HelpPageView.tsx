"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import { HelpHubBuyerChrome } from "@/components/help/HelpHubBuyerChrome";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT } from "@/lib/design-tokens";

import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpProductGuide } from "./HelpProductGuide";

/** Help Center hub body for `/help` (HEL). */
export function HelpPageView(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const heading = (
    <PageHeading
      navHref="/help"
      title="Help"
      description={
        <>
          Start with the guides below for review workflows and cloud connections. See{" "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href="/help/getting-started#how-archlucid-works"
          >
            How ArchLucid works
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
      }
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

  const guideBody = (
    <>
      {buyerPolishedShell ? null : (
        <GlossaryProceduralHelpVocabularyRail currentSurfaceId="help-hub" />
      )}
      {buyerPolishedShell ? null : (
        <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="help-hub" />
      )}
      <HelpProductGuide />
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
