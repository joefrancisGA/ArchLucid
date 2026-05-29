import { COMMAND_PALETTE_DISPLAY_SHORTCUT } from "@/lib/keyboard-shortcut-display";
import { cn } from "@/lib/utils";

export type KeyboardShortcutBadgeProps = {
  readonly shortcut?: string;
  readonly className?: string;
};

/**
 * Compact shortcut chip for shell chrome (command palette trigger, etc.).
 * Uses literal `Ctrl` text — never the macOS ⌘ glyph.
 */
export function KeyboardShortcutBadge(props: KeyboardShortcutBadgeProps) {
  const { shortcut = COMMAND_PALETTE_DISPLAY_SHORTCUT, className } = props;

  return (
    <span
      className={cn(
        "rounded border border-neutral-300 bg-white px-1 py-0.5 text-[10px] font-semibold text-neutral-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400",
        className,
      )}
    >
      {shortcut}
    </span>
  );
}
