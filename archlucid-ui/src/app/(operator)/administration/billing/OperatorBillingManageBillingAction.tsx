"use client";

import { useCallback, useRef, useState } from "react";

import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import type { ButtonProps } from "@/components/ui/button";
import { startBillingPortal } from "@/lib/billing-portal-client";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

type OperatorBillingManageBillingActionProps = {
  readonly canMutate: boolean;
  readonly idleLabel?: string;
  readonly loadingLabel?: string;
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly className?: string;
  readonly testId?: string;
};

/** Opens Stripe Billing Portal for payment-method updates and subscription management. */
export function OperatorBillingManageBillingAction(props: OperatorBillingManageBillingActionProps) {
  const {
    canMutate,
    idleLabel = "Manage billing",
    loadingLabel = "Opening portal…",
    variant = "outline",
    size,
    className,
    testId = "operator-billing-manage-billing",
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);

  const onManageBilling = useCallback(async () => {
    if (!canMutate || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsLoading(true);

    try {
      await startBillingPortal();
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [canMutate]);

  return (
    <AsyncActionButton
      type="button"
      variant={variant}
      size={size}
      className={className}
      data-testid={testId}
      idleLabel={idleLabel}
      loadingLabel={loadingLabel}
      isLoading={isLoading}
      disabled={!canMutate}
      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
      onClick={() => void onManageBilling()}
    />
  );
}
