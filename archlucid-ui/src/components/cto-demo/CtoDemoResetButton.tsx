"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BUYER_CTO_DEMO_RESET_BUSY_CTA,
  BUYER_CTO_DEMO_RESET_CTA,
  BUYER_CTO_DEMO_RESET_SUCCESS,
} from "@/lib/buyer/buyer-polish-copy";
import { resetBuyerCtoDemoSession } from "@/lib/buyer/buyer-cto-demo-orchestration";
import { ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT } from "@/lib/buyer/buyer-cto-demo-tour";
import { showError, showSuccess } from "@/lib/toast";

/** Returns the showcase to a pristine tour landing between sessions (#11). */
export function CtoDemoResetButton(): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onReset = useCallback(async () => {
    setBusy(true);

    try {
      const result = await resetBuyerCtoDemoSession();

      if (!result.seedSucceeded) {
        showError(
          "Demo reset",
          "Showcase seed was not confirmed — continuing with cached/static data if available.",
        );
      } else {
        showSuccess(BUYER_CTO_DEMO_RESET_SUCCESS);
      }

      window.dispatchEvent(new Event(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT));
      router.push(result.destinationHref);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Demo reset failed.";
      showError("Demo reset", message);
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      data-testid="cto-demo-reset-button"
      onClick={() => {
        void onReset();
      }}
    >
      {busy ? BUYER_CTO_DEMO_RESET_BUSY_CTA : BUYER_CTO_DEMO_RESET_CTA}
    </Button>
  );
}
