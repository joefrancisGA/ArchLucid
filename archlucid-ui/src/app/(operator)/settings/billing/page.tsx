import type { Metadata } from "next";

import { OperatorBillingSettingsClient } from "./OperatorBillingSettingsClient";

export const metadata: Metadata = {
  title: "Billing & plans",
};

type BillingSettingsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Self-serve tier comparison, usage, and AI usage credits (TB-014). */
export default async function BillingSettingsPage(props: BillingSettingsPageProps) {
  const searchParams = props.searchParams !== undefined ? await props.searchParams : {};
  const planRaw = searchParams.plan;
  const initialPlanId = typeof planRaw === "string" ? planRaw : null;

  return <OperatorBillingSettingsClient initialPlanId={initialPlanId} />;
}

