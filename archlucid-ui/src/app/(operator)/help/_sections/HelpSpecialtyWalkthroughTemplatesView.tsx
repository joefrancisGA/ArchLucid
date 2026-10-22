import { HelpSpecialtyWalkthroughTemplatesClient } from "@/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpSpecialtyWalkthroughTemplatesViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Guided specialty template catalog for `/help/specialty-walkthroughs`. */
export function HelpSpecialtyWalkthroughTemplatesView(
  props: HelpSpecialtyWalkthroughTemplatesViewProps,
): React.ReactElement {
  return <HelpSpecialtyWalkthroughTemplatesClient entry={props.entry} />;
}
