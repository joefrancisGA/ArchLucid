import type { Metadata } from "next";

import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

export const metadata: Metadata = {
  title: "Billing & plans",
};

/** Self-serve tier comparison and LLM prepaid wallet (TB-014). */
export default function BillingSettingsPage() {
  return (
    <div className="space-y-8">
      <OperatorBillingWalletPanel />
      <OperatorBillingPlansClient />
    </div>
  );
}
