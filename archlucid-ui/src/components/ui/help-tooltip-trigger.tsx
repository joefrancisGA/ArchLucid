"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { CircleHelp, Info } from "lucide-react";

/** Contextual explanations beside labels/fields (24px hit target). */
export type HelpTooltipTriggerSize = "contextual" | "toolbar";

/** Info = local explanation; help = docs/tutorials/global support. */
export type HelpTooltipTriggerIcon = "info" | "help";

export type HelpTooltipTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required accessible name — never render an unlabeled help trigger. */
  "aria-label": string;
  size?: HelpTooltipTriggerSize;
  icon?: HelpTooltipTriggerIcon;
};

const SIZE_STYLES: Record<
  HelpTooltipTriggerSize,
  { button: string; icon: string }
> = {
  contextual: {
    button:
      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-al-text-secondary transition-colors hover:bg-neutral-100 hover:text-al-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
    icon: "size-[15px]",
  },
  toolbar: {
    button:
      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
    icon: "size-[18px]",
  },
};

const DEFAULT_ICON_BY_SIZE: Record<HelpTooltipTriggerSize, HelpTooltipTriggerIcon> = {
  contextual: "info",
  toolbar: "help",
};

function renderTriggerIcon(icon: HelpTooltipTriggerIcon, iconClassName: string): React.JSX.Element {
  if (icon === "help") {
    return <CircleHelp className={iconClassName} aria-hidden />;
  }

  return <Info className={iconClassName} aria-hidden />;
}

/** Shared visual + hit-target contract for inline help/info tooltip triggers. */
export const HelpTooltipTrigger = forwardRef<HTMLButtonElement, HelpTooltipTriggerProps>(
  function HelpTooltipTrigger(props, ref) {
    const {
      size = "contextual",
      icon = DEFAULT_ICON_BY_SIZE[size],
      className,
      type = "button",
      children,
      ...rest
    } = props;
    const styles = SIZE_STYLES[size];

    return (
      <button
        ref={ref}
        type={type}
        data-help-tooltip-trigger=""
        data-help-tooltip-icon={icon}
        className={cn(styles.button, className)}
        {...rest}
      >
        {children ?? renderTriggerIcon(icon, styles.icon)}
      </button>
    );
  },
);

export function helpTooltipLinkClassName(
  size: HelpTooltipTriggerSize = "contextual",
  className?: string,
): string {
  return cn(SIZE_STYLES[size].button, "no-underline", className);
}

export function helpTooltipIconClassName(size: HelpTooltipTriggerSize = "contextual"): string {
  return SIZE_STYLES[size].icon;
}
