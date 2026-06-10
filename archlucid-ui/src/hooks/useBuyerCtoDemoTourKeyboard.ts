import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getBuyerCtoDemoJourneyStepHref } from "@/lib/buyer-cto-demo-orchestration";
import {
  ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT,
  readBuyerCtoDemoSpotlight,
  writeBuyerCtoDemoSpotlight,
} from "@/lib/buyer-cto-demo-tour";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
  writeOperatorDemoPanicOffline,
} from "@/lib/operator-static-demo";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();

  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

/** Press 1–5 to jump steps; S toggles spotlight; 0 toggles offline panic mode. */
export function useBuyerCtoDemoTourKeyboard(active: boolean): void {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();

        const next = !readBuyerCtoDemoSpotlight();

        writeBuyerCtoDemoSpotlight(next);

        window.dispatchEvent(
          new CustomEvent(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, { detail: { on: next } }),
        );

        return;
      }

      if (event.key === "0") {
        event.preventDefault();

        const next = !readOperatorDemoPanicOffline();

        writeOperatorDemoPanicOffline(next);

        window.dispatchEvent(
          new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, { detail: { on: next } }),
        );
        router.refresh();

        return;
      }

      const stepNumber = Number.parseInt(event.key, 10);

      if (!Number.isFinite(stepNumber) || stepNumber < 1 || stepNumber > 5) {
        return;
      }

      const href = getBuyerCtoDemoJourneyStepHref(stepNumber);

      if (href === null) {
        return;
      }

      event.preventDefault();
      router.push(href);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, router]);
}
