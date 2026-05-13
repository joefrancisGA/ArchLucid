import type { Metadata } from "next";

import { ExecutiveRoiDashboardPageView } from "./_sections/ExecutiveRoiDashboardPageView";

export const metadata: Metadata = {
  title: "Executive summary",
};

export default function ExecutiveRoiDashboardPage() {
  return <ExecutiveRoiDashboardPageView />;
}
