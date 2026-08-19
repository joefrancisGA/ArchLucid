import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InlineMetadataLineProps = {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly className?: string;
  readonly testId?: string;
};

/** Single helper line: medium `Label:` + normal-weight value (TB-1996). */
export function InlineMetadataLine(props: InlineMetadataLineProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={props.testId}
    >
      <InlineMetadataLabel label={props.label} /> {props.value}
    </p>
  );
}
