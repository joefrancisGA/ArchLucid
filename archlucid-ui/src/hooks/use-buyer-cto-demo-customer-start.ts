"use client";

import { useCallback, useRef, useState } from "react";

import {
  acknowledgeBuyerCtoDemoCustomerStart,
  evaluateBuyerCtoDemoCustomerStart,
  type BuyerCtoDemoCustomerStartOutcome,
} from "@/lib/buyer/buyer-cto-demo-customer-start";
import { BUYER_CTO_DEMO_PREPARING_LABEL } from "@/lib/buyer/buyer-polish-copy";

export type UseBuyerCtoDemoCustomerStartResult = {
  readonly isStarting: boolean;
  readonly loadingLabel: string;
  readonly errorMessage: string | null;
  readonly sampleModeNotice: string | null;
  readonly startDemo: () => Promise<BuyerCtoDemoCustomerStartOutcome | null>;
  readonly clearError: () => void;
};

/** Runs invisible customer preflight and blocks duplicate demo-start submissions. */
export function useBuyerCtoDemoCustomerStart(): UseBuyerCtoDemoCustomerStartResult {
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sampleModeNotice, setSampleModeNotice] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const startDemo = useCallback(async (): Promise<BuyerCtoDemoCustomerStartOutcome | null> => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsStarting(true);
    setErrorMessage(null);
    setSampleModeNotice(null);

    try {
      const outcome = await evaluateBuyerCtoDemoCustomerStart();

      if (outcome.status === "failed") {
        setErrorMessage(outcome.message);

        return outcome;
      }

      if (outcome.status === "ready-sample") {
        setSampleModeNotice(outcome.notice);
      }

      acknowledgeBuyerCtoDemoCustomerStart();

      return outcome;
    } finally {
      inFlightRef.current = false;
      setIsStarting(false);
    }
  }, []);

  return {
    isStarting,
    loadingLabel: BUYER_CTO_DEMO_PREPARING_LABEL,
    errorMessage,
    sampleModeNotice,
    startDemo,
    clearError,
  };
}
