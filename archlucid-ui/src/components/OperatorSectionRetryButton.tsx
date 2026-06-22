"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export type OperatorSectionRetryButtonProps = {
  /** Accessible label; defaults to “Retry loading”. */
  label?: string;
};

/**
 * Re-runs the current route’s server components (RSC refresh) after a failed section load.
 */
export function OperatorSectionRetryButton({ label = "Retry loading" }: OperatorSectionRetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-2"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      {isPending ? "Retrying…" : label}
    </Button>
  );
}
