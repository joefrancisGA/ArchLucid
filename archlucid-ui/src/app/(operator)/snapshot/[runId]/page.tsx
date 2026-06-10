import { redirect } from "next/navigation";

import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

type SnapshotPageProps = {
  readonly params: Promise<{ runId: string }>;
};

/** Stable leave-behind entry — redirects to executive summary in read-only mode. */
export default async function SnapshotPage(props: SnapshotPageProps): Promise<never> {
  const { runId } = await props.params;
  const normalized = canonicalizeDemoRunId(runId.trim());
  const executiveHref =
    normalized === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
      ? getShowcaseExecutiveHref()
      : `/executive/reviews/${encodeURIComponent(runId)}`;

  redirect(`${executiveHref}?readOnly=1`);
}
