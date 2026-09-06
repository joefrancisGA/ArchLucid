import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorHomeCardSectionTitleProps = {
  readonly id?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
};

/** Shared h2 for operator-home peer cards (command center, sample review, Continue setup, Setup and walkthroughs). */
export function OperatorHomeCardSectionTitle(
  props: OperatorHomeCardSectionTitleProps,
): React.JSX.Element {
  return (
    <h2 id={props.id} className={cn(OPERATOR_HOME_CARD_SECTION_HEADING, props.className)}>
      {props.children}
    </h2>
  );
}
