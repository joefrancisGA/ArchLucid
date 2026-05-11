import type { Metadata } from "next";

import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";

export const metadata: Metadata = {
  title: "Billing & plans",
};

/** Self-serve tier comparison for authenticated workspaces — presentation only until Stripe checkout is integrated. */
export default function BillingSettingsPage() {
  return <OperatorBillingPlansClient />;
}
