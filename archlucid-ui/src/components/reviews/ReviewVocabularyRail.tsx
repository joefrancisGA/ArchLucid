import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function ReviewVocabularyRail(): React.JSX.Element {
  return (
    <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="review-vocabulary-rail">
      Key terms: <InlineGlossaryChip nounId="finding">finding</InlineGlossaryChip>,{" "}
      <InlineGlossaryChip nounId="decision">decision</InlineGlossaryChip>,{" "}
      <InlineGlossaryChip nounId="policy-pack">policy pack</InlineGlossaryChip>,{" "}
      <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>, and{" "}
      <InlineGlossaryChip nounId="sealed-review-record">sealed review record</InlineGlossaryChip>.
    </p>
  );
}
