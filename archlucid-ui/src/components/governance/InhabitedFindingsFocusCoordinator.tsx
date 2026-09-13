"use client";

import { useEffect, useRef, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  focusFirstInhabitedFindingCard,
  INHABIT_FINDINGS_SKIP_TO_WORK_ID,
  INHABIT_FINDINGS_SKIP_TO_WORK_LABEL,
} from "@/lib/inhabit/inhabit-finding-focus";

export type InhabitedFindingsFocusCoordinatorProps = {
  readonly enabled: boolean;
  readonly hasFindingCards: boolean;
};

/** IH-059 — default keyboard focus on first finding when cards exist. */
export function InhabitedFindingsFocusCoordinator(
  props: InhabitedFindingsFocusCoordinatorProps,
): ReactElement | null {
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!props.enabled || !props.hasFindingCards || focusedRef.current) {
      return;
    }

    const timerId = window.setTimeout(() => {
      if (focusFirstInhabitedFindingCard()) {
        focusedRef.current = true;
      }
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [props.enabled, props.hasFindingCards]);

  if (!props.enabled || !props.hasFindingCards) {
    return null;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      data-testid="inhabited-findings-skip-to-work"
      onClick={() => {
        focusFirstInhabitedFindingCard();
      }}
    >
      <span id={INHABIT_FINDINGS_SKIP_TO_WORK_ID}>{INHABIT_FINDINGS_SKIP_TO_WORK_LABEL}</span>
    </Button>
  );
}
