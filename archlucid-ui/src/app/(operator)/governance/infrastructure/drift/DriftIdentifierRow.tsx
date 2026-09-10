import { CopyIdButton } from "@/components/CopyIdButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DriftIdentifierRow(props: {
  readonly label: string;
  readonly value: string;
  readonly copyAriaLabel: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{props.label}</div>
        <p className={cn("m-0 break-all font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {props.value}
        </p>
      </div>
      <CopyIdButton value={props.value} aria-label={props.copyAriaLabel} />
    </div>
  );
}
