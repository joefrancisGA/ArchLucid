"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperatorHomeNavigateLoadingButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  readonly href: string;
  readonly idleLabel: string;
  readonly loadingLabel: string;
};

/** Home intent CTA link with immediate loading feedback for client-side route transitions. */
export function OperatorHomeNavigateLoadingButton(
  props: OperatorHomeNavigateLoadingButtonProps,
): React.JSX.Element {
  const { href, idleLabel, loadingLabel, disabled, className, variant, size, ...buttonProps } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasStarted, setHasStarted] = useState(false);

  const navigate = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled === true || isPending || hasStarted) {
        event.preventDefault();

        return;
      }

      event.preventDefault();
      setHasStarted(true);
      void router.prefetch(href);

      startTransition(() => {
        router.push(href);
      });
    },
    [disabled, hasStarted, href, isPending, router],
  );

  const isLoading = isPending || hasStarted;

  return (
    <Button
      {...buttonProps}
      asChild
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading}
      data-loading={isLoading ? "true" : "false"}
    >
      <Link href={href} onClick={navigate} aria-live="polite">
        {isLoading ? (
          <>
            <ReviewStartInlineSpinner />
            <span>{loadingLabel}</span>
          </>
        ) : (
          idleLabel
        )}
      </Link>
    </Button>
  );
}
