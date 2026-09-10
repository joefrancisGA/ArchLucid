import type { ReactElement } from "react";

import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE,
  CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID,
} from "@/lib/career-rehearsal-help-evidence-copy";
import {
  CAREER_REHEARSAL_HELP_DOOR_CARDS,
  CAREER_REHEARSAL_HELP_FIRST_VIEWPORT_TEST_ID,
  CAREER_REHEARSAL_HELP_OVERVIEW,
  CAREER_REHEARSAL_HELP_PAGE_SUBTITLE,
  CAREER_REHEARSAL_HELP_PAGE_TITLE,
  CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID,
  CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY,
} from "@/lib/career-rehearsal-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpCareerRehearsalGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** AS-082 — Career vs Rehearsal Working desk orientation for `/help/career-vs-rehearsal`. */
export function HelpCareerRehearsalGuideView(props: HelpCareerRehearsalGuideViewProps): ReactElement {
  const { entry } = props;

  return (
    <div className={operatorPageContainerClass()} data-testid="help-career-rehearsal-guide">
      <HelpTopicHashScroll />
      <HelpTopicGuidePageHeader
        eyebrow="Working desk"
        title={CAREER_REHEARSAL_HELP_PAGE_TITLE}
        subtitle={CAREER_REHEARSAL_HELP_PAGE_SUBTITLE}
      />
      <div
        className={cn(OPERATOR_LAYOUT.majorSectionGap, "pb-10")}
        data-testid={CAREER_REHEARSAL_HELP_FIRST_VIEWPORT_TEST_ID}
        id={CAREER_REHEARSAL_HELP_PRIMARY_CONTENT_ID}
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CAREER_REHEARSAL_HELP_OVERVIEW}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {CAREER_REHEARSAL_HELP_DOOR_CARDS.map((door) => (
            <section
              key={door.doorId}
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid={`help-career-rehearsal-door-${door.doorId}`}
            >
              <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{door.title}</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{door.body}</p>
            </section>
          ))}
        </div>
        <section
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
          data-testid="help-career-rehearsal-simulator-honesty"
          id={CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID}
        >
          <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Simulator is not sponsor proof</h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY}</p>
          <p className={cn("mt-3 mb-0", OPERATOR_TYPOGRAPHY.caption)}>{CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE}</p>
        </section>
        <HelpTopicRegistryProvenanceLine entry={entry} />
      </div>
    </div>
  );
}
