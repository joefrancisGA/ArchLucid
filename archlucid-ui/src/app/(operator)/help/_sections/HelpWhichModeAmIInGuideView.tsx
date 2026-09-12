import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  MODE_GRAVITY_GUIDED_GRAVITY_ONE_SENTENCE,
  MODE_GRAVITY_WORKING_GRAVITY_ONE_SENTENCE,
  MODE_GRAVITY_WORKING_GRAVITY_REHEARSAL_EXCEPTION,
} from "@/lib/mode-gravity-working-gravity-one-sentence";
import {
  MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW,
  MODE_GRAVITY_HELP_WHICH_MODE_TITLE,
} from "@/lib/mode-gravity-help-which-mode-guide-content";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpWhichModeAmIInGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** MG-012 — Working vs Guided; then Career vs Rehearsal; demo/trial are eval. */
export function HelpWhichModeAmIInGuideView(
  props: HelpWhichModeAmIInGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-which-mode-am-i-in-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={MODE_GRAVITY_HELP_WHICH_MODE_TITLE}
        titleTestId="help-which-mode-am-i-in-page-title"
        subtitle="Workspace mode, execute gravity, and eval builds."
        navHref={MODE_GRAVITY_HELP_WHICH_MODE_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-which-mode-am-i-in-overview"
      >
        {MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW}
      </p>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-which-mode-working-heading">
        <h2
          id="help-which-mode-working-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Working
        </h2>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{MODE_GRAVITY_WORKING_GRAVITY_ONE_SENTENCE}</p>
        <p className={cn("m-0 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}>
          {MODE_GRAVITY_WORKING_GRAVITY_REHEARSAL_EXCEPTION}
        </p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-which-mode-guided-heading">
        <h2
          id="help-which-mode-guided-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Guided
        </h2>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{MODE_GRAVITY_GUIDED_GRAVITY_ONE_SENTENCE}</p>
      </section>

      <section className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-which-mode-eval-heading">
        <h2
          id="help-which-mode-eval-heading"
          className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
        >
          Demo and trial
        </h2>
        <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
          Demo, static showcase, and frictionless trial builds use eval chrome. They teach Simulator — they are not
          unlabeled Working Career days.
        </p>
      </section>
    </article>
  );
}
