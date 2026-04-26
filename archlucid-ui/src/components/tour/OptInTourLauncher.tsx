"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";

import { cn } from "@/lib/utils";

import { OptInTour } from "./OptInTour";

export type OptInTourLauncherProps = {
  /** Ghost sits beside hero CTAs as a tertiary action; default matches standalone use in a column. */
  buttonVariant?: "outline" | "ghost";
  className?: string;
};

/**
 * Operator-home launcher for the in-product opt-in tour. The button is the ONLY way
 * the tour opens (owner Q9 — never auto-launch). Even users who previously dismissed
 * the tour can re-open it by clicking again.
 */
export function OptInTourLauncher({ buttonVariant = "outline", className }: OptInTourLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    recordFirstTenantFunnelEvent("tour_opt_in");
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        className={cn(
          "font-normal",
          buttonVariant === "ghost" && "text-neutral-500 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-200",
          className,
        )}
        onClick={handleOpen}
        data-testid="opt-in-tour-launcher"
      >
        Take tour
      </Button>
      <OptInTour isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
