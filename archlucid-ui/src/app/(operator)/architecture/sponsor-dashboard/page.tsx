import dynamic from "next/dynamic";

const executiveDashboardLoading = (
  <div
    className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading sponsor dashboard"
    data-testid="sponsor-dashboard-chunk-loading"
  />
);

const SponsorRoiDashboardPageView = dynamic(
  () =>
    import("./_sections/SponsorRoiDashboardPageView").then(
      (module) => module.SponsorRoiDashboardPageView,
    ),
  { loading: () => executiveDashboardLoading },
);

export default function SponsorRoiDashboardPage() {
  return <SponsorRoiDashboardPageView surface="sponsor" />;
}
