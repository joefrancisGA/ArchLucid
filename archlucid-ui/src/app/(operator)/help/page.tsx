import type { Metadata } from "next";
import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpProductGuide } from "./HelpProductGuide";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Help",
};

/** Single guides list — admin and engineering topics stay behind Show advanced topics. */
export default function HelpPage() {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap}>
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
          <>
            <PageContextualHelpButton />
            <HelpTourTrigger />
          </>
        }
        bordered
      />
      <GlossaryProceduralHelpVocabularyRail currentSurfaceId="help-hub" />
      <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="help-hub" />
      <HelpProductGuide />
    </OperatorPageContainer>
  );
}
