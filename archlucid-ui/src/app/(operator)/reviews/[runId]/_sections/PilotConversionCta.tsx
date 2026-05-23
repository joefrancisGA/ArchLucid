"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

type PilotConversionCtaProps = {
  readonly trialActive: boolean;
  readonly blocksAdditionalLlmExecution: boolean;
};

/**
 * Inline conversion CTA when trial LLM execution is blocked in buyer-polished run detail.
 */
export function PilotConversionCta(props: PilotConversionCtaProps) {
  const { trialActive, blocksAdditionalLlmExecution } = props;

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

  if (!trialActive || !blocksAdditionalLlmExecution) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Pilot conversion call to action"
      className="rounded-lg border border-rose-300/90 bg-rose-50/95 px-4 py-3 text-sm text-rose-950 shadow-sm dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50"
      data-testid="pilot-conversion-cta"
    >
      <p className="m-0 font-semibold">Trial AI budget reached for this month</p>
      <p className="m-0 mt-1 leading-snug">
        Additional real-mode execution is blocked until billing is enabled for this workspace.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild type="button" size="sm" className="bg-rose-800 text-white hover:bg-rose-900 dark:bg-rose-700 dark:hover:bg-rose-600">
          <Link href="/pricing#pricing-quote-request">Request quote</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void onConvert()}>
          Convert to paid
        </Button>
      </div>
    </div>
  );
}
