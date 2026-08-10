import dynamic from "next/dynamic";

const executiveDashboardLoading = (
  <div
    className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading executive dashboard"
    data-testid="executive-dashboard-chunk-loading"
  />
);

const ExecutiveRoiDashboardPageView = dynamic(
  () =>
    import("./_sections/ExecutiveRoiDashboardPageView").then(
      (module) => module.ExecutiveRoiDashboardPageView,
    ),
  { loading: () => executiveDashboardLoading },
);

export default function ExecutiveRoiDashboardPage() {
  return <ExecutiveRoiDashboardPageView surface="executive" />;
}
