"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import {
  optInTourOverlayHrefFromSearch,
  parseOptInTourOpenFromSearch,
} from "@/lib/tour/opt-in-tour-overlay-url";

import { OptInTour } from "./OptInTour";
import { useTeachingChromeVisible } from "@/lib/workspace-mode/use-teaching-chrome-visible";

export type OptInTourLauncherProps = {
  className?: string;
};

/**
 * Operator-home launcher for the in-product opt-in tour. The button is the ONLY way
 * the tour opens (owner Q9 — never auto-launch). Even users who previously dismissed
 * the tour can re-open it by clicking again.
 */
export function OptInTourLauncher({ className }: OptInTourLauncherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const optInTourOpenParam = searchParams.get("optInTourOpen");
  const [isOpen, setIsOpenState] = useState(() => parseOptInTourOpenFromSearch(optInTourOpenParam));
  const teachingChromeVisible = useTeachingChromeVisible();

  const syncOptInTourOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(optInTourOverlayHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setIsOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setIsOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncOptInTourOpenToUrl(next);

        return next;
      });
    },
    [syncOptInTourOpenToUrl],
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    recordFirstTenantFunnelEvent("tour_opt_in");
  }, [setIsOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  if (!teachingChromeVisible) {
    return null;
  }

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
