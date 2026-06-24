import type { Metadata } from "next";

import { OperatorBillingSettingsClient } from "./OperatorBillingSettingsClient";

export const metadata: Metadata = {
  title: "Billing & plans",
};

/** Self-serve tier comparison, usage, and AI usage credits (TB-014). */
export default function BillingSettingsPage() {
  return <OperatorBillingSettingsClient />;
}
