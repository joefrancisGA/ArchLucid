"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useOperatorNextBestActionsQuery } from "@/hooks/use-operator-next-best-actions-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  resolveOperatorCanonicalNextAction,
  type OperatorCanonicalNextAction,
} from "@/lib/operator-canonical-next-action";
import { cn } from "@/lib/utils";

type OperatorHomeCanonicalNextActionSlotProps = {
  readonly clientFallback: Omit<OperatorCanonicalNextAction, "source">;
  readonly sampleLoading?: boolean;
  readonly slotTestId?: string;
  readonly bridgeTestId: string;
  readonly primaryTestId: string;
  readonly layout?: "stacked" | "inline";
};

/**
 * Single home next-action surface — tenant API first, lifecycle fallback second (TB-2232).
 */
export function OperatorHomeCanonicalNextActionSlot(
  props: OperatorHomeCanonicalNextActionSlotProps,
): React.JSX.Element {
  const hideForPolishedBuyerShell = isBuyerPolishedOperatorShellEnv();
  const layout = props.layout ?? (props.slotTestId !== undefined ? "stacked" : "inline");
  const { data: tenantActions, isPending, isError } = useOperatorNextBestActionsQuery({
    enabled: !hideForPolishedBuyerShell,
  });

  const resolvedAction = useMemo(() => {
    if (hideForPolishedBuyerShell || isError || tenantActions === undefined) {
      return resolveOperatorCanonicalNextAction([], props.clientFallback);
    }

    if (isPending) {
      return resolveOperatorCanonicalNextAction([], props.clientFallback);
    }

    return resolveOperatorCanonicalNextAction(tenantActions, props.clientFallback);
  }, [hideForPolishedBuyerShell, isError, isPending, props.clientFallback, tenantActions]);

  const content = (
    <>
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid={props.bridgeTestId}
      >
        {resolvedAction.bridgeCopy}
      </p>

      {props.sampleLoading === true ? (
        <p
          className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}
          aria-live="polite"
          data-testid="operator-home-do-this-next-sample-loading"
        >
          Loading completed sample…
        </p>
      ) : (
        <Button asChild variant="primary" size="sm" className="h-8 w-fit shrink-0">
          <Link href={resolvedAction.href} data-testid={props.primaryTestId}>
            {resolvedAction.label}
          </Link>
        </Button>
      )}
    </>
  );

  if (layout === "inline") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          OPERATOR_LAYOUT.inlineGap,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)}
      data-testid={props.slotTestId}
    >
      {content}
    </div>
  );
}
