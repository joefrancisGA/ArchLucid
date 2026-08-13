import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
  writeOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";

export type CtoDemoOfflineAutoFallbackReason = "browser-offline" | "network-error";

/** Enables cached showcase payloads when the browser reports offline during an active CTO demo. */
export function enableCtoDemoOfflineAutoFallback(reason: CtoDemoOfflineAutoFallbackReason): boolean {
  if (!isBuyerPolishedOperatorShellEnv() || !readBuyerCtoDemoTourActive()) {
    return false;
  }

  if (readOperatorDemoPanicOffline()) {
    return false;
  }

  writeOperatorDemoPanicOffline(true);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, {
        detail: { on: true, reason },
      }),
    );
  }

  return true;
}

export function shouldListenForCtoDemoOfflineAutoFallback(): boolean {
  return isBuyerPolishedOperatorShellEnv() && readBuyerCtoDemoTourActive() && !readOperatorDemoPanicOffline();
}
