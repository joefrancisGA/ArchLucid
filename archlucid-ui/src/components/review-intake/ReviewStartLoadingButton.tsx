"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { cn } from "@/lib/utils";

export type ReviewStartLoadingButtonProps = Omit<ButtonProps, "children"> & {
  readonly idleLabel: string;
  readonly loadingLabel: string;
  readonly isLoading: boolean;
  readonly preserveWidth?: boolean;
};

/** Review-start CTA with immediate loading feedback and stable width. */
export function ReviewStartLoadingButton(props: ReviewStartLoadingButtonProps): React.ReactElement {
  const { idleLabel, loadingLabel, isLoading, preserveWidth = true, className, disabled, ...buttonProps } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!preserveWidth || isLoading || buttonRef.current === null) {
      return;
    }

    const measuredWidth = buttonRef.current.getBoundingClientRect().width;

    if (measuredWidth > 0) {
      setMinWidth(measuredWidth);
    }
  }, [idleLabel, isLoading, preserveWidth]);

  return (
    <Button
      {...buttonProps}
      ref={buttonRef}
      type={buttonProps.type ?? "button"}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading}
      className={cn(className)}
      style={minWidth !== undefined ? { minWidth: `${minWidth}px` } : undefined}
      data-loading={isLoading ? "true" : "false"}
    >
      {isLoading ? (
        <>
          <ReviewStartInlineSpinner />
          <span>{loadingLabel}</span>
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
