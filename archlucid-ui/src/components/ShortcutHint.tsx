import { cn } from "@/lib/utils";

export type ShortcutHintProps = {
  shortcut: string;
  className?: string;
};

/**
 * Visible keyboard shortcut chip (uses global `kbd` styles). For page chrome where nav-style clutter is acceptable.
 */
export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  return <kbd className={cn(className)}>{shortcut}</kbd>;
}
