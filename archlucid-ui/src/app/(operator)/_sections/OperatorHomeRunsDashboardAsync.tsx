import { OperatorHomePageView } from "./OperatorHomePageView";
import { loadOperatorHomeRunsDashboardModel } from "./load-operator-home-runs-dashboard-model";

type OperatorHomeRunsDashboardAsyncProps = {
  readonly buyerPolishedShell: boolean;
};

/**
 * Async RSC: loads the home runs dashboard model then renders the full Overview view.
 * Suspended from `page.tsx` so redirect + Suspense chrome can paint before the dashboard await.
 */
export async function OperatorHomeRunsDashboardAsync(
  props: OperatorHomeRunsDashboardAsyncProps,
): Promise<React.JSX.Element> {
  const runsDashboard = await loadOperatorHomeRunsDashboardModel();

  return (
    <OperatorHomePageView
      model={{ buyerPolishedShell: props.buyerPolishedShell, runsDashboard }}
    />
  );
}
