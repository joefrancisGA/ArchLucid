import { INLINE_METADATA_LABEL_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InlineMetadataLabelProps = {
  readonly label: string;
  readonly className?: string;
  readonly testId?: string;
  /** When false, omits the trailing colon (e.g. stacked `<dt>` rows). Default true. */
  readonly withColon?: boolean;
};

/**
 * Medium-weight scan marker for inline metadata keys (`Label: value`).
 * Distinct from {@link InlineGuidanceLabel} (semibold) used for instructional prefixes.
 */
export function InlineMetadataLabel(props: InlineMetadataLabelProps): React.JSX.Element {
  const withColon = props.withColon !== false;
  const trimmed = props.label.trim();
  const withoutTrailingColon = trimmed.endsWith(":") ? trimmed.slice(0, -1) : trimmed;
  const label = withColon ? `${withoutTrailingColon}:` : withoutTrailingColon;

  return (
    <span className={cn(INLINE_METADATA_LABEL_CLASS, props.className)} data-testid={props.testId}>
      {label}
    </span>
  );
}
