"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";

export const OPERATOR_HELP_DRAWER_TRIGGER_SELECTOR = '[data-testid="operator-shell-help-trigger"]';

export type HelpDrawerContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Accessible name for the top-right dismiss control. */
  readonly closeAriaLabel?: string;
  /** When set, focus returns here on close instead of the shell Help button. */
  readonly returnFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Modal drawers dim and block the page. Contextual help that the reader must follow
   * while working on the page behind it passes `false` (parent must also set
   * `<Dialog modal={false}>`).
   */
  readonly modal?: boolean;
};

/**
 * Right-edge contextual help drawer: fixed width, slide-in panel, optional modal backdrop.
 */
export const HelpDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  HelpDrawerContentProps
>(({ className, children, closeAriaLabel = "Close help", returnFocusRef, modal = true, ...props }, ref) => (
  <DialogPortal>
    {modal ? <DialogOverlay className="bg-black/50 backdrop-blur-0" /> : null}
    <DialogPrimitive.Content
      ref={ref}
      aria-modal={modal}
      className={cn(
        "fixed inset-y-0 right-0 top-0 z-[51] flex h-full max-h-none w-full max-w-[min(100vw,32rem)] min-w-0 translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border border-l border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl outline-none duration-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        className,
      )}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event);

        if (event.defaultPrevented) {
          return;
        }

        event.preventDefault();

        const explicitTarget = returnFocusRef?.current;

        if (explicitTarget !== null && explicitTarget !== undefined) {
          explicitTarget.focus();
          return;
        }

        const shellHelpTrigger = document.querySelector<HTMLElement>(OPERATOR_HELP_DRAWER_TRIGGER_SELECTOR);

        shellHelpTrigger?.focus();
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        type="button"
        aria-label={closeAriaLabel}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-neutral-950 dark:focus:ring-neutral-500"
      >
        <X className="h-4 w-4" aria-hidden />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
HelpDrawerContent.displayName = "HelpDrawerContent";
