import type { Metadata } from "next";

import { ExecutiveRoiDashboardPageView } from "@/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const metadata: Metadata = {
  title: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageTitle,
};

export default function ExecutiveDashboardPage() {
  return <ExecutiveRoiDashboardPageView surface="executive" />;
}
