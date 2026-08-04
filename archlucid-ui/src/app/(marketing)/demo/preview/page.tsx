import type { Metadata } from "next";

import { normalizeSeeItMarketingPayload } from "../../see-it/normalize-see-it-payload";
import { DemoPreviewMarketingBody } from "./DemoPreviewMarketingBody";
import { DemoPreviewHero } from "./_sections/DemoPreviewHero";
import { DemoPreviewResultAtAGlance } from "./_sections/DemoPreviewResultAtAGlance";
import { DemoPreviewEvidenceOrientationStrip } from "@/components/marketing/DemoPreviewEvidenceOrientationStrip";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ArchLucid · See a finalized review (demo)",
  description: "A live review preview powered by the ArchLucid demo seed.",
  robots: { index: false, follow: false },
};

function resolveDemoPreviewApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_DEMO_PREVIEW_API_BASE?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const server = process.env.ARCHLUCID_API_BASE_URL?.trim();

  if (server) {
    return server.replace(/\/$/, "");
  }

  const pub = process.env.NEXT_PUBLIC_ARCHLUCID_API_BASE_URL?.trim();

  if (pub) {
    return pub.replace(/\/$/, "");
  }

  return "";
}

function curatedOfflinePayload(): DemoCommitPagePreviewResponse {
  return normalizeSeeItMarketingPayload(getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID));
}

function DemoPreviewPageShell({ payload }: { readonly payload: DemoCommitPagePreviewResponse }) {
  return (
    <main className="mx-auto max-w-[72rem] px-4 py-10">
      <DemoPreviewHero />
      <DemoPreviewEvidenceOrientationStrip />
      <div className="mt-8 space-y-10">
        <DemoPreviewResultAtAGlance payload={payload} />
        <DemoPreviewMarketingBody payload={payload} />
      </div>
    </main>
  );
}

export default async function DemoPreviewMarketingPage() {
  const base = resolveDemoPreviewApiBase();

  if (!base) {
    return <DemoPreviewPageShell payload={curatedOfflinePayload()} />;
  }

  const url = `${base}/v1/demo/preview`;
  let response: Response;

  try {
    response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(MARKETING_UPSTREAM_FETCH_TIMEOUT_MS),
    });
  } catch {
    return <DemoPreviewPageShell payload={curatedOfflinePayload()} />;
  }

  if (!response.ok) {
    return <DemoPreviewPageShell payload={curatedOfflinePayload()} />;
  }

  const payload = normalizeSeeItMarketingPayload((await response.json()) as DemoCommitPagePreviewResponse);

  return <DemoPreviewPageShell payload={payload} />;
}
