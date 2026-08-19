import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeContinueSetupCardProps = {
  readonly canBegin?: boolean;
  readonly blockerMessage?: string | null;
};

/**
 * Home readiness panel — renders only when a prerequisite blocks the first review.
 * There is no "ready" state: an unblocked workspace already shows enabled lifecycle CTAs,
 * and rendering reassurance while readiness is still loading would assert an unverified state.
 */
export function OperatorHomeContinueSetupCard(
  props: OperatorHomeContinueSetupCardProps = {},
): React.JSX.Element | null {
  const canBegin = props.canBegin !== false && props.blockerMessage == null;

  if (canBegin) {
    return null;
  }

  return (
    <section
      aria-labelledby="continue-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, OPERATOR_LAYOUT.sectionHeadingStack)}
      data-testid="home-block-continue-setup"
    >
      <OperatorHomeCardSectionTitle id="continue-setup-heading">
        {OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE}
      </OperatorHomeCardSectionTitle>

      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-home-readiness-blocker"
      >
        {props.blockerMessage}
      </p>
    </section>
  );
}
