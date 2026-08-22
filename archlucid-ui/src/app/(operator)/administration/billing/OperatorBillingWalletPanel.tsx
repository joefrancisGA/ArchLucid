"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showInfo } from "@/lib/toast";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

const MONTHLY_CAP_OPTIONS = Array.from({ length: 11 }, (_, index) => index * 50);

function resolveWalletAutoReplenishBlockingReason(
  autoReplenish: boolean,
  hasPaymentMethod: boolean,
  monthlyCapUsd: number,
): string | null {
  if (!autoReplenish) {
    return null;
  }

  if (!hasPaymentMethod) {
    return "Add a payment method before enabling auto-replenish.";
  }

  if (monthlyCapUsd <= 0) {
    return "Set a monthly cap above $0 before enabling auto-replenish.";
  }

  return null;
}

export function OperatorBillingWalletPanel() {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(0);
  const [autoReplenish, setAutoReplenish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletFetchFailed, setWalletFetchFailed] = useState(false);
  const [saveInlineError, setSaveInlineError] = useState<string | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setWalletFetchFailed(false);

    try {
      const res = await fetch(
        "/api/proxy/v1/billing/wallet",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setWallet(null);
        setWalletFetchFailed(true);
        return;
      }

      const data = (await res.json()) as WalletResponse;
      setWallet(data);
      setMonthlyCapUsd(data.monthlyCapUsd);
      setAutoReplenish(data.autoReplenishEnabled);
      setWalletFetchFailed(false);
    } catch {
      setWallet(null);
      setWalletFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const hasPaymentMethod = wallet?.hasPaymentMethod === true;
  const autoReplenishBlockingReason = resolveWalletAutoReplenishBlockingReason(
    autoReplenish,
    hasPaymentMethod,
    monthlyCapUsd,
  );
  const walletDirty =
    wallet !== null &&
    (autoReplenish !== wallet.autoReplenishEnabled || monthlyCapUsd !== wallet.monthlyCapUsd);
  const canSaveWallet =
    canMutate &&
    wallet !== null &&
    walletDirty &&
    autoReplenishBlockingReason === null;

  const saveWallet = async () => {
    if (!wallet || !canMutate) {
      return;
    }

    setSaveBusy(true);
    setSaveInlineError(null);

    try {
      const res = await fetch(
        "/api/proxy/v1/billing/wallet",
        mergeRegistrationScopeForProxy({
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            autoReplenishEnabled: autoReplenish,
            monthlyCapUsd,
            rowVersionBase64: wallet.rowVersionBase64,
          }),
        }),
      );

      if (res.status === 409) {
        showError("AI usage credit settings could not be saved because another update happened first. Refresh and try again.");
        return;
      }

      if (!res.ok) {
        const validationMessage = await res
          .json()
          .then((body) => (typeof body?.message === "string" ? body.message : null))
          .catch(() => null);

        if (res.status === 400 && validationMessage !== null) {
          setSaveInlineError(validationMessage);
          return;
        }

        showError("AI usage credit settings could not be saved. Try again in a moment.");
        return;
      }

      const data = (await res.json()) as WalletResponse;
      setWallet(data);
      setMonthlyCapUsd(data.monthlyCapUsd);
      setAutoReplenish(data.autoReplenishEnabled);
      setConfirmSaveOpen(false);
      showInfo("AI credit settings saved.");
    } finally {
      setSaveBusy(false);
    }
  };

  const onSaveClick = () => {
    if (!canSaveWallet) {
      return;
    }

    if (autoReplenish) {
      setConfirmSaveOpen(true);
      return;
    }

    void saveWallet();
  };

  const capSelectDescriptionId = "wallet-monthly-cap-description";
  const mutateDisabledHintId = "operator-billing-wallet-mutate-disabled-hint";
  const capSelectDescribedBy = !canMutate
    ? `${capSelectDescriptionId} ${mutateDisabledHintId}`
    : capSelectDescriptionId;

  if (loading) {
    return <p className={OPERATOR_TYPOGRAPHY.helper}>Loading prepaid credits…</p>;
  }

  if (walletFetchFailed || wallet === null) {
    return (
      <div id="billing-ai-credits" className="scroll-mt-24 space-y-4" data-testid="operator-billing-wallet-panel">
        <EnterpriseCompactEmptyState
          title="AI usage credit settings unavailable"
          description="Prepaid credit balance and auto-replenish controls could not be loaded."
          actions={[{ label: "Retry", href: "#billing-ai-credits", variant: "outline" }]}
          footer={
            <RefreshButton label="Retry loading" onClick={() => void loadWallet()} />
          }
          testId="operator-billing-wallet-fetch-error"
        />
        <section className="space-y-3" id="billing-payment-method">
          <h2 className={OPERATOR_NAV_GROUP_LABEL}>Payment method</h2>
          <Card data-testid="operator-billing-payment-method">
            <CardHeader className="pb-2">
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Payment method</CardTitle>
              <CardDescription>Used for plan checkout and AI credit auto-replenish.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                Payment method status unavailable until credit settings load.
              </p>
              <OperatorBillingManageBillingAction
                canMutate={canMutate}
                idleLabel="Add payment method"
                loadingLabel="Opening portal…"
                testId="operator-billing-payment-method-action"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    );
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
            <Label htmlFor="wallet-monthly-cap">Monthly auto-replenish cap (USD)</Label>
            <Select
              value={String(monthlyCapUsd)}
              onValueChange={(value) => setMonthlyCapUsd(Number(value))}
              disabled={!canMutate}
            >
              <SelectTrigger
                id="wallet-monthly-cap"
                aria-describedby={capSelectDescribedBy}
              >
                <SelectValue placeholder="Select cap" />
              </SelectTrigger>
              <SelectContent>
                {MONTHLY_CAP_OPTIONS.map((cap) => (
                  <SelectItem key={cap} value={String(cap)}>${cap} / month max</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id={capSelectDescriptionId} className={cn("tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              ${monthlyCapUsd} / month maximum auto-replenish when enabled ($50 steps, up to $500).
            </p>
          </div>

          <div className="space-y-2">
            <div className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <Checkbox
                id="wallet-auto-replenish"
                checked={autoReplenish}
                onCheckedChange={(checked) => setAutoReplenish(checked === true)}
                disabled={!canMutate}
                aria-describedby={!canMutate ? mutateDisabledHintId : undefined}
              />
              <Label htmlFor="wallet-auto-replenish">Enable auto-replenish (requires payment method and cap &gt; $0)</Label>
            </div>
            {autoReplenishBlockingReason !== null ? (
              <div className="space-y-1">
                <OperatorMutationInlineError
                  message={autoReplenishBlockingReason}
                  testId="operator-billing-wallet-auto-replenish-inline-error"
                />
                {!hasPaymentMethod ? (
                  <Link href="#billing-payment-method" className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}>
                    Open payment method
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          {saveInlineError !== null ? (
            <OperatorMutationInlineError message={saveInlineError} testId="operator-billing-wallet-save-inline-error" />
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={onSaveClick}
            disabled={!canSaveWallet}
            aria-describedby={!canMutate ? mutateDisabledHintId : undefined}
          >
            Save AI credit settings
          </Button>

          {!canMutate ? (
            <p
              id={mutateDisabledHintId}
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            >
              Administrator access required to change AI credit settings.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3" id="billing-payment-method">
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

      <ConfirmationDialog
        open={confirmSaveOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmSaveOpen(false);
          }
        }}
        title="Confirm auto-replenish authorization"
        description="You are authorizing recurring charges up to the monthly cap below. Charges occur when your prepaid balance drops below the refill threshold."
        confirmLabel="Confirm and save"
        cancelLabel="Cancel"
        variant="default"
        busy={saveBusy}
        onConfirm={() => void saveWallet()}
        extraContent={
          <p className={cn("m-0 font-medium tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Maximum monthly auto-replenish: ${monthlyCapUsd}
          </p>
        }
      />
    </div>
  );
}
