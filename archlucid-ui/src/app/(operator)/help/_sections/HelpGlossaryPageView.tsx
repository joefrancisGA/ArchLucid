import { HelpGlossaryPageClient } from "@/app/(operator)/help/_sections/HelpGlossaryPageClient";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import {
  CUSTOMER_GLOSSARY_PAGE_INTRO,
  CUSTOMER_GLOSSARY_PAGE_SECONDARY,
  CUSTOMER_GLOSSARY_PAGE_TITLE,
} from "@/lib/customer-glossary-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpGlossaryPageViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Customer-facing glossary for `/help/glossary`. */
export function HelpGlossaryPageView(props: HelpGlossaryPageViewProps): React.ReactElement {
  void props.entry;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "mx-auto w-full max-w-[68rem]")}
      data-testid="help-glossary-page"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-3 pb-4")}>
        <HelpTopicTitleRow title={CUSTOMER_GLOSSARY_PAGE_TITLE} />
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CUSTOMER_GLOSSARY_PAGE_INTRO}
        </p>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CUSTOMER_GLOSSARY_PAGE_SECONDARY}
        </p>
      </header>
      <HelpGlossaryPageClient />
    </article>
  );
}
