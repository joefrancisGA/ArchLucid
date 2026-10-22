import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveCommandPaletteDisplayShortcut } from "@/lib/keyboard-shortcut-display";

export type KeyboardShortcutBadgeProps = {
  readonly shortcut?: string;
  readonly className?: string;
};

/**
 * Compact shortcut chip for shell chrome (command palette trigger, etc.).
 * Uses Cmd+K on Apple platforms and Ctrl+K elsewhere — never the ⌘ glyph.
 */
export function KeyboardShortcutBadge(props: KeyboardShortcutBadgeProps) {
  const { shortcut = resolveCommandPaletteDisplayShortcut(), className } = props;

  return (
    <span
      className={cn("rounded border border-neutral-300 bg-white px-1 py-0.5 font-semibold text-neutral-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge,
        className,
      )}
    >
      {shortcut}
    </span>
  );
}
