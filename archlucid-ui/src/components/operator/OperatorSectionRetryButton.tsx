"use client";

import { Button } from "@/components/ui/button";
import { useSoftNavigationLoading } from "@/hooks/use-soft-navigation-loading";

export type OperatorSectionRetryButtonProps = {
  /** Accessible label; defaults to “Retry loading”. */
  label?: string;
};

/**
 * Re-runs the current route’s server components (RSC refresh) after a failed section load.
 */
export function OperatorSectionRetryButton({ label = "Retry loading" }: OperatorSectionRetryButtonProps) {
  const softNav = useSoftNavigationLoading();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-2"
      disabled={softNav.isNavigating}
      aria-busy={softNav.isNavigating}
      onClick={() => {
        softNav.navigate("", "refresh");
      }}
    >
      {softNav.isNavigating ? "Retrying…" : label}
    </Button>
  );
}
