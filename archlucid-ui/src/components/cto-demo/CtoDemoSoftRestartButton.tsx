"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { softRestartBuyerCtoDemoSession } from "@/lib/buyer/buyer-cto-demo-orchestration";
import { BUYER_CTO_DEMO_SOFT_RESTART_CTA } from "@/lib/buyer/buyer-polish-copy";

export function CtoDemoSoftRestartButton(): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(() => {
    setBusy(true);

    const { destinationHref } = softRestartBuyerCtoDemoSession();

    router.push(destinationHref);
    setBusy(false);
  }, [router]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-neutral-600 dark:text-neutral-400"
      disabled={busy}
      data-testid="cto-demo-soft-restart"
      onClick={onClick}
    >
      {BUYER_CTO_DEMO_SOFT_RESTART_CTA}
    </Button>
  );
}
