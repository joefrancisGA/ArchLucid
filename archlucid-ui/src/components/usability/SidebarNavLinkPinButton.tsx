"use client";

import { cn } from "@/lib/utils";
import { Pin, PinOff } from "lucide-react";

type SidebarNavLinkPinButtonProps = {
  readonly pinned: boolean;
  readonly label: string;
  readonly onToggle: () => void;
};

/** Per-link pin affordance in the sidebar — complements the pinned-links panel. */
export function SidebarNavLinkPinButton(props: SidebarNavLinkPinButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        "ml-auto shrink-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity group-hover/link:opacity-100 focus-visible:opacity-100 hover:text-al-text-primary",
        props.pinned ? "opacity-100 text-al-accent-interactive" : null,
      )}
      aria-label={props.pinned ? `Unpin ${props.label}` : `Pin ${props.label}`}
      aria-pressed={props.pinned}
      data-testid="sidebar-nav-link-pin"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        props.onToggle();
      }}
    >
      {props.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
