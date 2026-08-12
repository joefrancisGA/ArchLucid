"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { showError, showInfo } from "@/lib/toast";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { OperatorBillingManageBillingAction } from "./OperatorBillingManageBillingAction";

type WalletResponse = {
  balanceUsd: number;
  autoReplenishEnabled: boolean;
  monthlyCapUsd: number;
  refillIncrementUsd: number;
  refillTriggerThresholdUsd: number;
  autoRefillsThisUtcMonthCount: number;
  lastRefillUtc?: string | null;
  hasPaymentMethod: boolean;
  rowVersionBase64: string;
};

export function OperatorBillingWalletPanel() {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(0);
  const [autoReplenish, setAutoReplenish] = useState(false);
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
    if (!wallet || !canMutate) {
      return;
    }

    const res = await fetch("/api/proxy/v1/billing/wallet", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        autoReplenishEnabled: autoReplenish,
        monthlyCapUsd,
        rowVersionBase64: wallet.rowVersionBase64,
      }),
    });

    if (!res.ok) {
      showError("AI usage credit settings could not be saved (validation or concurrency conflict).");
      return;
    }

    const data = (await res.json()) as WalletResponse;
    setWallet(data);
    showInfo("AI credit settings saved.");
  };

  if (loading) {
    return <p className={OPERATOR_TYPOGRAPHY.helper}>Loading prepaid credits…</p>;
  }

  if (!wallet) {
    return null;
  }

  return (
    <div id="billing-ai-credits" className="scroll-mt-24 space-y-4" data-testid="operator-billing-wallet-panel">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Prepaid AI credits</CardTitle>
          <CardDescription>
            Credit balance covers AI usage after your plan&apos;s included monthly allowance is consumed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className={cn("grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Credit balance</dt>
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
              disabled={!canMutate}
              title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            />
            <p className={cn("tabular-nums", OPERATOR_TYPOGRAPHY.body)}>${monthlyCapUsd} / month max auto-replenish</p>
          </div>

          <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
            <input
              type="checkbox"
              checked={autoReplenish}
              onChange={(e) => setAutoReplenish(e.target.checked)}
              disabled={!canMutate}
              title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            />
            Enable auto-replenish (requires payment method and cap &gt; $0)
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={() => void saveWallet()}
            disabled={!canMutate}
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
          >
            Save AI credit settings
          </Button>

          {!canMutate ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Administrator access required to change AI credit settings.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className={OPERATOR_NAV_GROUP_LABEL}>Payment method</h2>
        <Card data-testid="operator-billing-payment-method">
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Payment method</CardTitle>
            <CardDescription>Used for plan checkout and AI credit auto-replenish.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {wallet.hasPaymentMethod ? "Payment method on file." : "No payment method on file."}
            </p>
            <OperatorBillingManageBillingAction
              canMutate={canMutate}
              idleLabel={wallet.hasPaymentMethod ? "Update payment method" : "Add payment method"}
              loadingLabel="Opening portal…"
              testId="operator-billing-payment-method-action"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
