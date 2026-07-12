import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import {
  OPERATOR_HOME_CONTINUE_SETUP_BODY,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeContinueSetupCardProps = {
  readonly loading?: boolean;
  readonly canBegin?: boolean;
  readonly blockerMessage?: string | null;
};

/** Home readiness panel — compact reassurance that no setup is required before starting. */
export function OperatorHomeContinueSetupCard(props: OperatorHomeContinueSetupCardProps = {}) {
  const canBegin = props.canBegin !== false && props.blockerMessage == null;
  const heading = canBegin ? OPERATOR_HOME_READY_TO_BEGIN_TITLE : OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE;

  return (
    <section
      aria-labelledby="continue-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, OPERATOR_LAYOUT.sectionHeadingStack)}
      data-testid="home-block-continue-setup"
    >
      <OperatorHomeCardSectionTitle id="continue-setup-heading">
        {heading}
      </OperatorHomeCardSectionTitle>

      {canBegin ? (
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {OPERATOR_HOME_CONTINUE_SETUP_BODY}
        </p>
      ) : (
        <p
          className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
          data-testid="operator-home-readiness-blocker"
        >
          {props.blockerMessage}
        </p>
      )}
    </section>
  );
}
