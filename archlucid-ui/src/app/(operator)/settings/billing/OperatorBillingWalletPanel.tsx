"use client";

import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showInfo } from "@/lib/toast";

type WalletResponse = {
  balanceUsd: number;
  autoReplenishEnabled: boolean;
  monthlyCapUsd: number;
  refillIncrementUsd: number;
  refillTriggerThresholdUsd: number;
  autoRefillsThisUtcMonthCount: number;
  lastRefillUtc?: string | null;
  hasPaymentMethod: boolean;
  stripePublishableKey?: string | null;
  rowVersionBase64: string;
};

export function OperatorBillingWalletPanel() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(0);
  const [autoReplenish, setAutoReplenish] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState("");
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/proxy/v1/billing/wallet", { headers: { Accept: "application/json" } });

      if (!res.ok) {
        showError("Could not load AI usage credit settings.");
        return;
      }

      const data = (await res.json()) as WalletResponse;
      setWallet(data);
      setMonthlyCapUsd(data.monthlyCapUsd);
      setAutoReplenish(data.autoReplenishEnabled);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const saveWallet = async () => {
    if (!wallet) {
      return;
    }

    const res = await fetch("/api/proxy/v1/billing/wallet", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        autoReplenishEnabled: autoReplenish,
        monthlyCapUsd,
        stripeCustomerId: stripeCustomerId.trim() || undefined,
        stripePaymentMethodId: stripePaymentMethodId.trim() || undefined,
        rowVersionBase64: wallet.rowVersionBase64,
      }),
    });

    if (!res.ok) {
      showError("AI usage credit settings could not be saved (validation or concurrency conflict).");
      return;
    }

    const data = (await res.json()) as WalletResponse;
    setWallet(data);
    showInfo("AI usage credit settings saved.");
  };

  const onAddPaymentMethod = () => {
    showInfo("Payment method setup is coming soon. Contact support if you need to attach a card before self-serve checkout ships.");
  };

  if (loading) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading AI usage credits…</p>;
  }

  if (!wallet) {
    return null;
  }

  return (
    <div id="billing-ai-credits" className="scroll-mt-24 space-y-4" data-testid="operator-billing-wallet-panel">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          AI usage credits
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Credits cover AI usage beyond your plan&apos;s included monthly allocation.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credit balance</CardTitle>
          <CardDescription>
            Non-expiring credits for review overages. Auto-replenish adds ${wallet.refillIncrementUsd} when balance
            drops below ${wallet.refillTriggerThresholdUsd}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Balance</dt>
              <dd className="font-medium tabular-nums">${wallet.balanceUsd.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Refills this UTC month</dt>
              <dd className="tabular-nums">{wallet.autoRefillsThisUtcMonthCount}</dd>
            </div>
            {wallet.lastRefillUtc ? (
              <div className="sm:col-span-2">
                <dt className="text-neutral-500 dark:text-neutral-400">Last refill (UTC)</dt>
                <dd>{new Date(wallet.lastRefillUtc).toLocaleString()}</dd>
              </div>
            ) : null}
          </dl>

          <div className="space-y-2">
            <Label htmlFor="wallet-monthly-cap">Monthly auto-replenish cap (USD, $0–$500 step $50)</Label>
            <Input
              id="wallet-monthly-cap"
              type="range"
              min={0}
              max={500}
              step={50}
              value={monthlyCapUsd}
              onChange={(e) => setMonthlyCapUsd(Number(e.target.value))}
            />
            <p className="text-sm tabular-nums">${monthlyCapUsd} / month max auto-replenish</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoReplenish}
              onChange={(e) => setAutoReplenish(e.target.checked)}
            />
            Enable auto-replenish (requires payment method and cap &gt; $0)
          </label>

          <Button type="button" onClick={() => void saveWallet()}>
            Save credit settings
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="operator-billing-payment-method">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment method</CardTitle>
          <CardDescription>Used for plan checkout and AI usage credit auto-replenish.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="m-0 text-sm text-al-text-primary">
            {wallet.hasPaymentMethod ? "Payment method on file." : "No payment method on file."}
          </p>
          <Button type="button" variant="outline" onClick={onAddPaymentMethod}>
            Add payment method
          </Button>
        </CardContent>
      </Card>

      <CollapsibleSection title="Advanced billing details" sectionTestId="operator-billing-advanced-details">
        <div className="space-y-4">
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Integration identifiers for staging and support. These fields are not shown in normal buyer-facing flows once
            Stripe Elements checkout ships.
          </p>
          <div className="space-y-2">
            <Label htmlFor="stripe-customer">Stripe customer id</Label>
            <Input
              id="stripe-customer"
              value={stripeCustomerId}
              onChange={(e) => setStripeCustomerId(e.target.value)}
              placeholder="cus_…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stripe-pm">Stripe payment method id</Label>
            <Input
              id="stripe-pm"
              value={stripePaymentMethodId}
              onChange={(e) => setStripePaymentMethodId(e.target.value)}
              placeholder="pm_…"
            />
            {wallet.stripePublishableKey ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Publishable key configured for this environment.
              </p>
            ) : null}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
