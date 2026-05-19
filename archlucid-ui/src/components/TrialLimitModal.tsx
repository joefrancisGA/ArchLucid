"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatTrialLimitReasonLabel } from "@/lib/trial-limit-problem";
import { subscribeTrialLimitModal, type TrialLimitModalPayload } from "@/lib/trial-limit-modal-bridge";
import { showError, showSuccess } from "@/lib/toast";

function formatDaysRemainingLine(daysRemaining: number | null): string | null {
  if (daysRemaining === null) {
    return null;
  }

  if (daysRemaining <= 0) {
    return "Trial time remaining: none (expired or in post-trial phase).";
  }

  return `Trial time remaining: ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`;
}

/** Global host for trial-limit modals opened from the API client layer. */
export function TrialLimitModalHost() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<TrialLimitModalPayload | null>(null);

  useEffect(() => {
    return subscribeTrialLimitModal((next) => {
      setPayload(next);
      setOpen(true);
    });
  }, []);

  const onConvert = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/billing/checkout",
        mergeRegistrationScopeForProxy({ method: "POST", headers: { Accept: "application/json" } }),
      );

      const json = (await res.json().catch(() => null)) as { status?: string } | null;

      if (!res.ok) {
        showError("Billing", `Checkout request failed (${res.status}).`);

        return;
      }

      if (json?.status === "not_configured") {
        showSuccess("Billing: checkout will open here once billing is connected for your tenant.");

        return;
      }

      showSuccess("Billing: request accepted.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Request failed.";
      showError("Billing", message);
    }
  }, []);

  const daysLine = payload !== null ? formatDaysRemainingLine(payload.daysRemaining) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="trial-limit-modal">
        <DialogHeader>
          <DialogTitle>{payload?.title ?? "Trial limit reached"}</DialogTitle>
          <DialogDescription className="sr-only">Trial subscription limit details</DialogDescription>
        </DialogHeader>
        <TrialLimitModalBody payload={payload} daysLine={daysLine} />
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Continue browsing
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/pricing#pricing-quote-request">Request quote</Link>
          </Button>
          <Button type="button" onClick={() => void onConvert()}>
            Upgrade / convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TrialLimitModalBodyProps = {
  payload: TrialLimitModalPayload | null;
  daysLine: string | null;
};

function TrialLimitModalBody({ payload, daysLine }: TrialLimitModalBodyProps) {
  if (payload === null) {
    return <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">A trial limit blocked this action.</p>;
  }

  return (
    <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
      <p className="m-0">{formatTrialLimitReasonLabel(payload.trialReason)}</p>
      {payload.detail.length > 0 ? <p className="m-0 text-neutral-600 dark:text-neutral-400">{payload.detail}</p> : null}
      {daysLine !== null ? <p className="m-0">{daysLine}</p> : null}
      <p className="m-0 text-neutral-600 dark:text-neutral-400">
        Read-only views and exports may still work depending on your trial phase. Upgrade to restore full write access.
      </p>
    </div>
  );
}
