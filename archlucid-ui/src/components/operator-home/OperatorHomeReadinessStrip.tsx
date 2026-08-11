import { OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeReadinessStripProps = {
  readonly canBegin?: boolean;
  readonly blockerMessage?: string | null;
};

/**
 * Blocker-only readiness line beside primary home choices.
 * The unblocked state renders nothing: the enabled lifecycle CTAs already say the workspace can start,
 * so a "Ready" pill adds no information and would claim readiness before the context has even loaded.
 */
export function OperatorHomeReadinessStrip(props: OperatorHomeReadinessStripProps = {}): React.JSX.Element | null {
  const canBegin = props.canBegin !== false && props.blockerMessage == null;

  if (canBegin) {
    return null;
  }

  return (
    <p
      role="status"
      className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
      data-testid="operator-home-readiness-blocker"
    >
      <span className="font-medium text-al-text-primary">{OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE}</span>
      {" · "}
      {props.blockerMessage}
    </p>
  );
}
