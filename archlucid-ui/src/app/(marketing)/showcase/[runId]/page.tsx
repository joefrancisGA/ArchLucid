import type { Metadata } from "next";

import { showcaseTitleForRunId } from "@/lib/showcase-page-copy";

import {
  resolveShowcasePageRenderPlan,
} from "./showcase-page-server-resolution";
import { ShowcasePageFailedView, ShowcasePayloadView } from "./ShowcasePageViewShell";

// Next 16 requires a literal export (no imported identifier). Keep in sync with SHOWCASE_PAGE_REVALIDATE_SECONDS.
export const revalidate = 300;

type PageProps = {
  params: Promise<{ runId: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { runId } = await props.params;

  return {
    title: `ArchLucid · ${showcaseTitleForRunId(runId)}`,
    description: "Completed architecture output — review, findings, artifacts, and review trail.",
    robots: { index: true, follow: true },
  };
}

/** Public marketing projection of finalized run preview (dynamic API path; static fallback when no API URL). */
export default async function MarketingShowcasePage(props: PageProps) {
  const { runId } = await props.params;
  const plan = await resolveShowcasePageRenderPlan(runId);

  if (plan.kind === "failed") {
    return <ShowcasePageFailedView runId={plan.runId} reason={plan.reason} />;
  }

  return (
    <ShowcasePayloadView
      runId={plan.runId}
      payload={plan.payload}
      banner={plan.banner}
      renderMode={plan.renderMode}
    />
  );
}
