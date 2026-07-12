import { StatusTag } from "@/components/ui/status-tag";
import {
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
  OPERATOR_HOME_READY_STRIP_LABEL,
  OPERATOR_HOME_READY_STRIP_SUPPORT,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeReadinessStripProps = {
  readonly canBegin?: boolean;
  readonly blockerMessage?: string | null;
};

/** Compact readiness reassurance beside primary home choices. */
export function OperatorHomeReadinessStrip(props: OperatorHomeReadinessStripProps = {}): React.JSX.Element {
  const canBegin = props.canBegin !== false && props.blockerMessage == null;

  if (!canBegin) {
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

  return (
    <p
      role="status"
      aria-label={`${OPERATOR_HOME_READY_TO_BEGIN_TITLE}. ${OPERATOR_HOME_READY_STRIP_LABEL}`}
      className={cn("m-0 inline-flex flex-wrap items-center gap-2", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
      data-testid="operator-home-readiness-strip"
    >
      <StatusTag kind="ready" label={OPERATOR_HOME_READY_TO_BEGIN_TITLE} />
      <span>{OPERATOR_HOME_READY_STRIP_SUPPORT}</span>
    </p>
  );
}
