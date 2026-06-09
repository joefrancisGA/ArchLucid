import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getBuyerCtoDemoJourneyStepHref } from "@/lib/buyer-cto-demo-orchestration";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();

  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

/** Press 1–5 during the CTO demo tour to jump to golden-journey steps (#14). */
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
