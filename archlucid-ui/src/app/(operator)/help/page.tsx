import type { Metadata } from "next";
import Link from "next/link";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpDocsClient } from "./HelpDocsClient";
import { HelpProductGuide } from "./HelpProductGuide";
import { HelpTabsShell } from "./HelpTabsShell";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Help",
};

/** Product guidance (guide tab default) + documentation index tab. */
export default function HelpPage() {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>Help</h1>
        <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>
          Start with the product guide for review workflows and cloud connections. See{" "}
          <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/help/how-it-works">
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
          for security posture. Open the Documentation tab for searchable reference links.
        </p>
        </div>
        <HelpTourTrigger />
      </div>

      <HelpTabsShell guide={<HelpProductGuide />} docs={<HelpDocsClient />} />
    </OperatorPageContainer>
  );
}
