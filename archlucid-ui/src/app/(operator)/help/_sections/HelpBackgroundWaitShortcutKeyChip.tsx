import { ShortcutHint } from "@/components/ShortcutHint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type HelpBackgroundWaitShortcutKeyChipProps = {
  readonly shortcut: string;
  readonly scope: string;
  readonly label: string;
  readonly className?: string;
};

/** Shared shortcut key chip for background-wait help resume + keyboard sections (DW-015). */
export function HelpBackgroundWaitShortcutKeyChip(
  props: HelpBackgroundWaitShortcutKeyChipProps,
): React.JSX.Element {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", props.className)}>
      <ShortcutHint shortcut={props.shortcut} />
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">{props.label}</span>
        <span aria-hidden="true"> · </span>
        <span>{props.scope}</span>
      </span>
    </span>
  );
}
