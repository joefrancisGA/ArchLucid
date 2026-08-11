import type { Metadata } from "next";

import { LiveDemoEvidenceOrientationStrip } from "@/components/marketing/LiveDemoEvidenceOrientationStrip";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { parseLiveDemoWalkthroughStepId } from "@/lib/live-demo-walkthrough-steps";
import { LIVE_DEMO_PAGE_METADATA_TITLE } from "@/lib/live-demo-page-copy";

import { normalizeSeeItMarketingPayload } from "../see-it/normalize-see-it-payload";
import { LiveDemoMarketingBody } from "./LiveDemoMarketingBody";
import { LiveDemoPageHeader } from "./LiveDemoPageHeader";

export const revalidate = 300;

export const metadata: Metadata = {
  title: LIVE_DEMO_PAGE_METADATA_TITLE,
  description: "Guided, read-only architecture review walkthrough using fabricated sample data.",
  robots: { index: false, follow: false },
};

function resolveDemoPreviewApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_DEMO_PREVIEW_API_BASE?.trim();

  if (explicit)
    return explicit.replace(/\/$/, "");

  const server = process.env.ARCHLUCID_API_BASE_URL?.trim();

  if (server)
    return server.replace(/\/$/, "");

  const pub = process.env.NEXT_PUBLIC_ARCHLUCID_API_BASE_URL?.trim();

  if (pub)
    return pub.replace(/\/$/, "");

  return "";
}

function curatedOfflinePayload(): DemoCommitPagePreviewResponse {
  return normalizeSeeItMarketingPayload(getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID));
}

function LiveDemoPageShell(props: {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly activeStepId: ReturnType<typeof parseLiveDemoWalkthroughStepId>;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <LiveDemoPageHeader />
      <LiveDemoEvidenceOrientationStrip />
      <div className="mt-10">
        <LiveDemoMarketingBody payload={props.payload} activeStepId={props.activeStepId} />
      </div>
    </main>
  );
}

export default async function LiveDemoMarketingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ step?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeStepId = parseLiveDemoWalkthroughStepId(resolvedSearchParams.step);
  const base = resolveDemoPreviewApiBase();

  if (!base) {
    return <LiveDemoPageShell payload={curatedOfflinePayload()} activeStepId={activeStepId} />;
  }

  const url = `${base}/v1/public/demo/sample-run`;
  let response: Response;

  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(MARKETING_UPSTREAM_FETCH_TIMEOUT_MS),
    });
  } catch {
    return <LiveDemoPageShell payload={curatedOfflinePayload()} activeStepId={activeStepId} />;
  }

  if (!response.ok) {
    return <LiveDemoPageShell payload={curatedOfflinePayload()} activeStepId={activeStepId} />;
  }

  const payload = normalizeSeeItMarketingPayload((await response.json()) as DemoCommitPagePreviewResponse);

  return <LiveDemoPageShell payload={payload} activeStepId={activeStepId} />;
}
