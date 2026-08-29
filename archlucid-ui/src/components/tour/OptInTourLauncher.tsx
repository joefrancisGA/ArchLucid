"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";

import { OptInTour } from "./OptInTour";

export type OptInTourLauncherProps = {
  className?: string;
};

/**
 * Operator-home launcher for the in-product opt-in tour. The button is the ONLY way
 * the tour opens (owner Q9 — never auto-launch). Even users who previously dismissed
 * the tour can re-open it by clicking again.
 */
export function OptInTourLauncher({ className }: OptInTourLauncherProps) {
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
        variant="outline"
        size="sm"
        className={cn(
          "inline-flex items-center gap-1.5 border-neutral-300 text-neutral-800 dark:border-neutral-600 dark:text-neutral-200",
          className,
        )}
        onClick={handleOpen}
        data-testid="opt-in-tour-launcher"
      >
        <Play className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        How it works
      </Button>
      <OptInTour isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
