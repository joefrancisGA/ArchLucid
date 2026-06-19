import type { Metadata } from "next";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { HelpTourTrigger } from "./HelpTourTrigger";
import { HelpDocsClient } from "./HelpDocsClient";
import { HelpProductGuide } from "./HelpProductGuide";
import { HelpTabsShell } from "./HelpTabsShell";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Help",
};

/** Product guidance (guide tab default) + documentation index tab. */
export default function HelpPage() {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Help</h1>
        <p className="m-0 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Start with the product guide. Open the Documentation tab for searchable reference links (including repo paths).
        </p>
        </div>
        <HelpTourTrigger />
      </div>

      <HelpTabsShell guide={<HelpProductGuide />} docs={<HelpDocsClient />} />
    </OperatorPageContainer>
  );
}
