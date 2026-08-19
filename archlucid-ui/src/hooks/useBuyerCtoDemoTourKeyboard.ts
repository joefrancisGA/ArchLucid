import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getBuyerCtoDemoJourneyStepHref } from "@/lib/buyer/buyer-cto-demo-orchestration";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT,
  clearBuyerCtoDemoState,
  getStartCtoDemoTourHref,
  readBuyerCtoDemoSpotlight,
  writeBuyerCtoDemoSpotlight,
} from "@/lib/buyer/buyer-cto-demo-tour";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
  writeOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";

export type BuyerCtoDemoTourKeyboardHandlers = {
  readonly onExploreToggle?: () => void;
  readonly onPresenterLayerToggle?: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();

  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

/** Press 1–5 to jump steps; E explore; P presenter layer; S spotlight; 0 offline panic; Shift+R reset. */
export function useBuyerCtoDemoTourKeyboard(active: boolean, handlers?: BuyerCtoDemoTourKeyboardHandlers): void {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === "R" || event.key === "r") {
          event.preventDefault();

          clearBuyerCtoDemoState();
          writeOperatorDemoPanicOffline(false);
          window.dispatchEvent(
            new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, { detail: { on: false } }),
          );

          const step1Href = getStartCtoDemoTourHref();
          window.dispatchEvent(new CustomEvent(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT));
          router.push(step1Href);

          return;
        }

        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        handlers?.onExploreToggle?.();

        return;
      }

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        handlers?.onPresenterLayerToggle?.();

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
  }, [active, handlers, router]);
}
