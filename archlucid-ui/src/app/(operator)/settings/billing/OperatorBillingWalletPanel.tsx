"use client";

import { useCallback, useEffect, useState } from "react";

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
        showError("Could not load LLM wallet settings.");
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
    if (!wallet) return;

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
      showError("Wallet settings could not be saved (validation or concurrency conflict).");
      return;
    }

    const data = (await res.json()) as WalletResponse;
    setWallet(data);
    showInfo("LLM wallet settings saved.");
  };

  if (loading) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading LLM wallet…</p>;
  }

  if (!wallet) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM prepaid wallet</CardTitle>
        <CardDescription>
          Non-expiring overage credit after your UTC-month included cap. Auto-replenish charges ${wallet.refillIncrementUsd}{" "}
          when balance drops below ${wallet.refillTriggerThresholdUsd} (Stripe TEST in staging).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Balance</dt>
            <dd className="font-medium tabular-nums">${wallet.balanceUsd.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Refills this UTC month</dt>
            <dd className="tabular-nums">{wallet.autoRefillsThisUtcMonthCount}</dd>
          </div>
          {wallet.lastRefillUtc ? (
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Last refill (UTC)</dt>
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

        <div className="space-y-2">
          <Label htmlFor="stripe-customer">Stripe customer id (TEST: cus_…)</Label>
          <Input id="stripe-customer" value={stripeCustomerId} onChange={(e) => setStripeCustomerId(e.target.value)} placeholder="cus_…" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stripe-pm">Stripe payment method id (TEST: pm_…)</Label>
          <Input id="stripe-pm" value={stripePaymentMethodId} onChange={(e) => setStripePaymentMethodId(e.target.value)} placeholder="pm_…" />
          {wallet.stripePublishableKey ? (
            <p className="text-xs text-neutral-500">Publishable key configured — attach a card in Stripe Dashboard or Elements (follow-on).</p>
          ) : null}
        </div>

        <Button type="button" onClick={() => void saveWallet()}>
          Save wallet settings
        </Button>
      </CardContent>
    </Card>
  );
}
