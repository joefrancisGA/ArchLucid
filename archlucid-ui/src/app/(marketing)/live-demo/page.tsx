import type { Metadata } from "next";

import {
  LIVE_DEMO_FABRICATED_DISCLOSURE,
  LIVE_DEMO_PAGE_METADATA_TITLE,
  LIVE_DEMO_PAGE_SUBTITLE,
  LIVE_DEMO_PAGE_TITLE,
  LIVE_DEMO_SAMPLE_IDENTITY,
  LIVE_DEMO_SAMPLE_SCENARIO,
  LIVE_DEMO_VALUE_PROPOSITION,
} from "@/lib/live-demo-page-copy";
import { LiveDemoEvidenceOrientationStrip } from "@/components/marketing/LiveDemoEvidenceOrientationStrip";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { parseLiveDemoWalkthroughStepId } from "@/lib/live-demo-walkthrough-steps";
import { cn } from "@/lib/utils";

import { normalizeSeeItMarketingPayload } from "../see-it/normalize-see-it-payload";
import { LiveDemoMarketingBody } from "./LiveDemoMarketingBody";

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
      <header className="max-w-3xl">
        <p className={cn("m-0 text-teal-800 dark:text-teal-300", MARKETING_TYPOGRAPHY.meta)}>Sample walkthrough</p>
        <h1 className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{LIVE_DEMO_PAGE_TITLE}</h1>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
          {LIVE_DEMO_PAGE_SUBTITLE}
        </p>
        <p className={cn("m-0 mt-4 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
          {LIVE_DEMO_VALUE_PROPOSITION}
        </p>
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
          role="status"
          data-testid="live-demo-fabricated-disclosure"
        >
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
            {LIVE_DEMO_SAMPLE_IDENTITY}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {LIVE_DEMO_SAMPLE_SCENARIO}
          </p>
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
            {LIVE_DEMO_FABRICATED_DISCLOSURE}
          </p>
        </div>
      </header>
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
