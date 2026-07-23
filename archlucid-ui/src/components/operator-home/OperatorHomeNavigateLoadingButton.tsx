"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Soft-nav can stall without unmounting; recover instead of leaving the CTA depressed. */
export const OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS = 20_000;

type OperatorHomeNavigateLoadingButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  readonly href: string;
  readonly idleLabel: string;
  readonly loadingLabel: string;
  readonly onNavigate?: () => void;
};

/** Home intent CTA link with immediate loading feedback for client-side route transitions. */
export function OperatorHomeNavigateLoadingButton(
  props: OperatorHomeNavigateLoadingButtonProps,
): React.JSX.Element {
  const { href, idleLabel, loadingLabel, disabled, className, variant, size, onNavigate, ...buttonProps } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutIdRef = useRef<number | null>(null);
  const wasPendingRef = useRef(false);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const releaseLoading = useCallback(() => {
    clearLoadingTimeout();
    setIsLoading(false);
  }, [clearLoadingTimeout]);

  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;

      return;
    }

    if (wasPendingRef.current && isLoading) {
      wasPendingRef.current = false;
      releaseLoading();
    }
  }, [isLoading, isPending, releaseLoading]);

  useEffect(() => {
    return () => {
      clearLoadingTimeout();
    };
  }, [clearLoadingTimeout]);

  const navigate = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled === true || isPending || isLoading) {
        event.preventDefault();

        return;
      }

      event.preventDefault();
      setIsLoading(true);
      wasPendingRef.current = false;
      onNavigate?.();
      void router.prefetch(href);
      clearLoadingTimeout();

      timeoutIdRef.current = window.setTimeout(() => {
        setIsLoading(false);
        timeoutIdRef.current = null;
      }, OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS);

      startTransition(() => {
        router.push(href);
      });
    },
    [clearLoadingTimeout, disabled, href, isLoading, isPending, onNavigate, router],
  );

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
