import type { Metadata } from "next";

import { loadRunsPageModel } from "./_sections/load-runs-page-model";
import { RunsPageView } from "./_sections/RunsPageView";
import type { RunsPageSearchParams } from "./_sections/runs-page-model";

export const metadata: Metadata = {
  title: "Reviews",
};

/** Server-rendered run list page. Fetches a page of runs and validates via coerceRunSummaryPaged. */
export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<RunsPageSearchParams>;
}) {
  const resolved = await searchParams;
  const model = await loadRunsPageModel(resolved);

  return <RunsPageView model={model} />;
}
