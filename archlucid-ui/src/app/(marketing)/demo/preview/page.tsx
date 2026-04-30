import type { Metadata } from "next";

import { normalizeSeeItMarketingPayload } from "../../see-it/normalize-see-it-payload";
import { DemoPreviewMarketingBody } from "./DemoPreviewMarketingBody";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ArchLucid · See a finalized manifest (demo)",
  description: "A live manifest preview powered by the ArchLucid demo seed.",
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

export default async function DemoPreviewMarketingPage() {
  const base = resolveDemoPreviewApiBase();

  if (!base) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">See a finalized manifest (demo)</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Showing a curated sample architecture review.</p>
        <div className="mt-8">
          <DemoPreviewMarketingBody payload={curatedOfflinePayload()} />
        </div>
      </main>
    );
  }

  const url = `${base}/v1/demo/preview`;
  let response: Response;

  try {
    response = await fetch(url, { next: { revalidate: 300 } });
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">See a finalized manifest (demo)</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Showing a curated sample architecture review.</p>
        <div className="mt-8">
          <DemoPreviewMarketingBody payload={curatedOfflinePayload()} />
        </div>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">See a finalized manifest (demo)</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Showing a curated sample architecture review.</p>
        <div className="mt-8">
          <DemoPreviewMarketingBody payload={curatedOfflinePayload()} />
        </div>
      </main>
    );
  }

  const payload = normalizeSeeItMarketingPayload((await response.json()) as DemoCommitPagePreviewResponse);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">See a finalized manifest (demo)</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        A read-only walkthrough of a completed architecture review — suitable for procurement and sponsor conversations.
      </p>
      <div className="mt-8">
        <DemoPreviewMarketingBody payload={payload} />
      </div>
    </main>
  );
}
