"use client";

import { cn } from "@/lib/utils";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";

type AdvancedOptionsAccordionProps = {
  children: ReactNode;
  className?: string;
  /** Defaults to "Advanced Options" — use for buyer-safe disclosure of IDs and technical fields. */
  triggerLabel?: string;
  /** When true, accordion starts expanded (e.g. after generator handoff). */
  defaultOpen?: boolean;
  /** Controlled open state; pair with {@link onOpenChange}. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Enterprise-heavy controls grouped behind progressive disclosure. Defaults closed so Core Pilot
 * surfaces stay lightweight until expanded.
 */
export function AdvancedOptionsAccordion({
  children,
  className,
  triggerLabel,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: AdvancedOptionsAccordionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const panelId = useId();

  function handleOpenChange(next: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }

    onOpenChange?.(next);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50/70 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-auto w-full justify-between gap-2 px-4 py-3 text-left hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span>{triggerLabel ?? "Advanced Options"}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-neutral-600 transition-transform dark:text-neutral-400",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div id={panelId} className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-700">
          <div className="grid gap-6">{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
