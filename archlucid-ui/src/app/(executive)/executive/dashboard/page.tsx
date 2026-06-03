import { ExecutiveRoiDashboardPageView } from "@/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView";

/** Executive-chrome ROI dashboard (TB-267) — same data panels as operator dashboard without full operator shell. */
export default function ExecutiveDashboardPage() {
  return <ExecutiveRoiDashboardPageView surface="executive" />;
}
