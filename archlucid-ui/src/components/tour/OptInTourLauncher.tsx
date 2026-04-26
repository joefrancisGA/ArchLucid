"use client";

import { Play } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";

import { cn } from "@/lib/utils";

import { OptInTour } from "./OptInTour";

export type OptInTourLauncherProps = {
  /** Outline reads as a tertiary control beside primary hero CTAs; ghost stays available for dense rows. */
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
          "inline-flex items-center gap-1.5 font-medium",
          buttonVariant === "ghost" &&
            "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
          buttonVariant === "outline" &&
            "border-neutral-300 text-neutral-800 dark:border-neutral-600 dark:text-neutral-200",
          className,
        )}
        onClick={handleOpen}
        data-testid="opt-in-tour-launcher"
      >
        <Play className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        Take tour
      </Button>
      <OptInTour isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
