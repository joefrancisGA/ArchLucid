import type { Metadata } from "next";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveRoiDashboardPageView } from "./_sections/ExecutiveRoiDashboardPageView";

export const metadata: Metadata = {
  title: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
};

export default function ExecutiveRoiDashboardPage() {
  return <ExecutiveRoiDashboardPageView />;
}
