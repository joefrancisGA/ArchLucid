import type { Metadata } from "next";
import Link from "next/link";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpProductGuide } from "./HelpProductGuide";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Help",
};

/** Single guides list — admin and engineering topics stay behind Show advanced topics. */
export default function HelpPage() {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HelpTopicTitleRow title="Help" />
        <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>
          Start with the guides below for review workflows and cloud connections. See{" "}
          <Link
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href="/help/getting-started#how-archlucid-works"
          >
            How ArchLucid works
          </Link>{" "}
          for the workflow, the{" "}
          <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/faq">
            Product FAQ
          </Link>{" "}
          for evaluation and pricing answers, and{" "}
          <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/help/data-handling">
            data handling
          </Link>{" "}
          for security posture.
        </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PageContextualHelpButton />
          <HelpTourTrigger />
        </div>
      </div>
      <GlossaryProceduralHelpVocabularyRail currentSurfaceId="help-hub" />
      <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="help-hub" />
      <HelpProductGuide />
    </OperatorPageContainer>
  );
}
