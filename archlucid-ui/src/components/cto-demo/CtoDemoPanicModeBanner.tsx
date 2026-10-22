"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
  writeOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  BUYER_CTO_DEMO_PANIC_BANNER,
  BUYER_CTO_DEMO_PANIC_DISABLE_CTA,
} from "@/lib/buyer/buyer-polish-copy";

export function CtoDemoPanicModeBanner(): React.JSX.Element | null {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [panicOn, setPanicOn] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPanicOn(readOperatorDemoPanicOffline());

    function onPanicChanged(): void {
      setPanicOn(readOperatorDemoPanicOffline());
    }

    window.addEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, onPanicChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, onPanicChanged);
    };
  }, []);

  const disablePanic = useCallback(() => {
    writeOperatorDemoPanicOffline(false);

    window.dispatchEvent(new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, { detail: { on: false } }));
    router.refresh();
  }, [router]);

  if (!mounted || !isBuyerPolishedOperatorShellEnv() || !panicOn) {
    return null;
  }

  return (
    <div
      className={cn("fixed inset-x-0 top-0 z-[9985] flex items-center justify-center gap-2 bg-amber-600 px-4 py-1.5 font-semibold text-white print:hidden", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="cto-demo-panic-banner"
      role="status"
    >
      {BUYER_CTO_DEMO_PANIC_BANNER}
      <button
        type="button"
        className="underline underline-offset-2"
        onClick={disablePanic}
      >
        {BUYER_CTO_DEMO_PANIC_DISABLE_CTA}
      </button>
    </div>
  );
}
