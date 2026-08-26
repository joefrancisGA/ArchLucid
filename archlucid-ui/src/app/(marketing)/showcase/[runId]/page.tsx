import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

import {
  DemoPreviewMarketingBody,
  DemoPreviewNotAvailable,
} from "../../demo/preview/DemoPreviewMarketingBody";
import { ShowcaseEvidenceOrientationStrip } from "@/components/marketing/ShowcaseEvidenceOrientationStrip";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload } from "@/lib/showcase-static-demo";
import {
  SHOWCASE_CURATED_STATIC_DISCLOSURE,
  SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE,
  SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE,
} from "@/lib/showcase-disclosure-copy";
import {
  decodeShowcaseRunId,
  hasCuratedShowcaseStaticPayload,
  isShowcaseStaticFirstRunId,
} from "@/lib/showcase-page-resolution";
import { SHOWCASE_PRIMARY_CONTENT_ID, showcaseTitleForRunId } from "@/lib/showcase-page-copy";
import { canShowcaseAnonymousVisitorOpenOperatorDeepLinks } from "@/lib/showcase-quick-nav-contract";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { ShowcaseHero } from "./ShowcaseHero";

import {
  ShowcaseOutcomeCards,
  ShowcaseWhatThisProves,
  showcaseOutcomeSnapshotFromPayload,
} from "./ShowcaseWhatThisProves";
import { ShowcaseQuickNav } from "./ShowcaseQuickNav";
import { ShowcaseBottomCTA } from "./ShowcaseBottomCTA";
import { ShowcasePageTelemetry } from "./ShowcasePageTelemetry";
import { resolveShowcaseScenarioSlug, type ShowcaseRenderMode } from "@/lib/marketing/showcase-telemetry";

export const revalidate = 300;

/** Showcase hero already surfaces demo disclosure — hide duplicate banner inside `DemoPreviewMarketingBody`. */
const SHOWCASE_SUPPRESS_EMBEDDED_STATUS_BANNER =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";

type PageProps = {
  params: Promise<{ runId: string }>;
};

function shouldServeShowcaseStaticOnly(): boolean {
  const a = process.env.SHOWCASE_STATIC_ONLY?.trim().toLowerCase();
  const b = process.env.NEXT_PUBLIC_SHOWCASE_STATIC_ONLY?.trim().toLowerCase();

  return a === "true" || a === "1" || b === "true" || b === "1";
}

function resolveShowcaseApiBase(): string {
  if (shouldServeShowcaseStaticOnly()) {
    return "";
  }

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

function ShowcaseOutcomeStripAboveBody({ payload }: { readonly payload: DemoCommitPagePreviewResponse }): ReactElement {
  return (
    <section aria-labelledby="showcase-outcome-strip-heading" className="mb-6 space-y-3">
      <h2
        id="showcase-outcome-strip-heading"
        className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50"
      >
        At a glance
      </h2>
      <ShowcaseOutcomeCards snapshot={showcaseOutcomeSnapshotFromPayload(payload)} />
    </section>
  );
}

function ShowcaseLead({ children }: { readonly children: ReactNode }) {
  return <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{children}</p>;
}

function ShowcaseOrientationTop(): ReactElement {
  return (
    <div data-testid="showcase-orientation-top">
      <ShowcaseEvidenceOrientationStrip part="claim" />
      <ShowcaseEvidenceOrientationStrip part="sources" />
    </div>
  );
}

/** Bottom conversion — public marketing surface; deep-links to trial and sign-in. */
function ShowcaseBottomCTASection({
  runId,
  renderMode,
}: {
  readonly runId: string;
  readonly renderMode: ShowcaseRenderMode;
}): ReactElement {
  return <ShowcaseBottomCTA scenario={resolveShowcaseScenarioSlug(runId)} renderMode={renderMode} />;
}

function ShowcaseSponsorReport({ payload }: { readonly payload: DemoCommitPagePreviewResponse }): ReactElement {
  const keys = keyDriversFromPayload(payload);
  const riskLine =
    keys[0] ??
    "PHI and data-minimization boundaries were reviewed against the proposed intake flow.";

  return (
    <section
      aria-label="Sponsor report"
      className="mb-6 rounded-lg border border-neutral-200 bg-white/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/50"
    >
      <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50">Sponsor report</h2>
      <p className="mt-3 mb-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <strong className="font-medium text-neutral-900 dark:text-neutral-100">What changed:</strong> the architecture
        moves from an underspecified intake hand-off to an export-ready package with explicit decisions and traceable
        evidence.
      </p>
      <p className="mt-2 mb-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <strong className="font-medium text-neutral-900 dark:text-neutral-100">What risk was found:</strong> {riskLine}
      </p>
      <p className="mt-2 mb-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <strong className="font-medium text-neutral-900 dark:text-neutral-100">What decision is now defensible:</strong>{" "}
        sponsors can reference a single finalized review, linked findings, and audit-ready lineage instead of ad-hoc
        slide decks.
      </p>
    </section>
  );
}

/** One-line teaser under the hero — caps length for marketing hero layout. */
function trimLeadDescription(desc: string | undefined | null): string {
  const t = (desc ?? "").trim();

  if (t.length === 0) {
    return "Sample output for a finalized architecture analysis — review, artifacts, and review trail.";
  }

  return t.length <= 80 ? t : `${t.slice(0, 77)}…`;
}

function keyDriversFromPayload(payload: DemoCommitPagePreviewResponse): string[] {
  const raw = payload.runExplanation?.explanation?.keyDrivers;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 4);
}

/** Served when preview API responds with an error — still renders curated demo data. Hidden in demo mode (single disclosure in body banner). */
function ShowcaseApiUnavailableBanner(): ReactElement | null {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return null;
  }

  return (
    <div
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 mt-4 px-3 py-2 text-xs"
      role="status"
      data-testid="showcase-api-unavailable-banner"
    >
      <span className="font-semibold">{SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE}.</span> {SHOWCASE_OFFLINE_ILLUSTRATIVE_DISCLOSURE}
    </div>
  );
}

function ShowcaseLoadFailed(): ReactElement {
  return (
    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
      This showcase could not be loaded right now. Please try again later.
    </p>
  );
}

/** Shared banner when browsing static baked-in demo preview (API not reachable). Hidden in demo mode — body shows DemoStatusBanner. */
function ShowcaseStaticDemoBanner(): ReactElement | null {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return null;
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mt-4 px-3 py-2 text-xs"
      role="status"
      data-testid="showcase-static-demo-banner"
    >
      <span className="font-semibold">{SHOWCASE_ILLUSTRATIVE_SAMPLE_TITLE}.</span> {SHOWCASE_CURATED_STATIC_DISCLOSURE}
    </div>
  );
}

function ShowcasePayloadView({
  runId,
  payload,
  banner,
  renderMode,
}: {
  readonly runId: string;
  readonly payload: DemoCommitPagePreviewResponse;
  readonly banner: "static" | "api-fallback" | null;
  readonly renderMode: ShowcaseRenderMode;
}): ReactElement {
  const scenario = resolveShowcaseScenarioSlug(runId);

  return (
    <ShowcasePageTelemetry runId={runId} renderMode={renderMode}>
      <main className="mx-auto max-w-5xl px-4 py-10">
      <a href={`#${SHOWCASE_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to sample showcase
      </a>

      <ShowcaseHero runId={runId} />

      <div id={SHOWCASE_PRIMARY_CONTENT_ID} className="scroll-mt-24">
      <ShowcaseLead>{trimLeadDescription(payload.run.description)}</ShowcaseLead>

      <ShowcaseOrientationTop />

      <ShowcaseSponsorReport payload={payload} />

      <div className="mt-6">
        <ShowcaseWhatThisProves
          scenarioBullets={keyDriversFromPayload(payload)}
          outcomeSnapshot={showcaseOutcomeSnapshotFromPayload(payload)}
          showOutcomeCards={false}
        />
      </div>

      {banner === "static" ? <ShowcaseStaticDemoBanner /> : null}
      {banner === "api-fallback" ? <ShowcaseApiUnavailableBanner /> : null}

      <ShowcaseOutcomeStripAboveBody payload={payload} />

      <ShowcaseQuickNav
        payload={payload}
        operatorDeepLinksAvailable={canShowcaseAnonymousVisitorOpenOperatorDeepLinks(runId)}
        renderMode={renderMode}
      />

      <div className="mt-6">
        <DemoPreviewMarketingBody
          payload={payload}
          suppressStatusBanner={SHOWCASE_SUPPRESS_EMBEDDED_STATUS_BANNER}
          showcaseTelemetry={{ scenario, renderMode }}
        />
      </div>

      <ShowcaseBottomCTASection runId={runId} renderMode={renderMode} />
      </div>
      </main>
    </ShowcasePageTelemetry>
  );
}

function ShowcaseFailedShell({
  runId,
  children,
}: {
  readonly runId: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <ShowcasePageTelemetry runId={runId} renderMode="failed">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <a href={`#${SHOWCASE_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
          Skip to sample showcase
        </a>
        <ShowcaseHero runId={runId} />
        <div id={SHOWCASE_PRIMARY_CONTENT_ID} className="scroll-mt-24">
          <ShowcaseOrientationTop />
          {children}
        </div>
        <ShowcaseBottomCTASection runId={runId} renderMode="failed" />
      </main>
    </ShowcasePageTelemetry>
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { runId } = await props.params;

  return {
    title: `ArchLucid · ${showcaseTitleForRunId(runId)}`,
    description: "Completed architecture output — review, findings, artifacts, and review trail.",
    robots: { index: true, follow: true },
  };
}

async function fetchShowcasePayload(
  url: string,
): Promise<{ kind: "ok"; payload: DemoCommitPagePreviewResponse } | { kind: "bad_json" } | { kind: "missing" } | { kind: "not_found" } | { kind: "http_error" } | { kind: "invalid" }> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(MARKETING_UPSTREAM_FETCH_TIMEOUT_MS),
    });

    if (response.status === 404)
      return { kind: "not_found" };

    if (!response.ok)
      return { kind: "http_error" };

    let payload: DemoCommitPagePreviewResponse;

    try {
      payload = (await response.json()) as DemoCommitPagePreviewResponse;
    } catch {
      return { kind: "bad_json" };
    }

    if (payload == null || typeof payload !== "object" || payload.run == null || payload.manifest == null)
      return { kind: "invalid" };

    if (!Array.isArray(payload.artifacts) || !Array.isArray(payload.pipelineTimeline))
      return { kind: "invalid" };

    return { kind: "ok", payload };
  } catch {
    return { kind: "missing" };
  }
}

/** Public marketing projection of finalized run preview (dynamic API path; static fallback when no API URL). */
export default async function MarketingShowcasePage(props: PageProps) {
  const { runId } = await props.params;
  const decodedRunId = decodeShowcaseRunId(runId);
  const base = resolveShowcaseApiBase();

  if (!base || isShowcaseStaticFirstRunId(decodedRunId)) {
    const payload = getShowcaseStaticDemoPayload(decodedRunId);

    return (
      <ShowcasePayloadView
        runId={runId}
        payload={payload}
        banner={base ? null : "static"}
        renderMode={base ? "api" : "static"}
      />
    );
  }

  const encoded = encodeURIComponent(decodedRunId);
  const url = `${base}/v1/marketing/showcase/${encoded}`;
  const bundle = await fetchShowcasePayload(url);

  switch (bundle.kind) {
    case "not_found":
    case "invalid": {
      if (hasCuratedShowcaseStaticPayload(decodedRunId)) {
        const fallbackPayload = getShowcaseStaticDemoPayload(decodedRunId);

        return (
          <ShowcasePayloadView
            runId={runId}
            payload={fallbackPayload}
            banner="api-fallback"
            renderMode="api_fallback"
          />
        );
      }

      return (
        <ShowcaseFailedShell runId={runId}>
          <div className="mt-6">
            <DemoPreviewNotAvailable />
          </div>
        </ShowcaseFailedShell>
      );
    }

    case "ok":
      return (
        <ShowcasePayloadView runId={runId} payload={bundle.payload} banner={null} renderMode="api" />
      );

    case "bad_json": {
      return (
        <ShowcaseFailedShell runId={runId}>
          <ShowcaseLoadFailed />
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            The server returned data this page could not read.
          </p>
        </ShowcaseFailedShell>
      );
    }

    case "http_error":
    case "missing": {
      if (hasCuratedShowcaseStaticPayload(decodedRunId)) {
        const fallbackPayload = getShowcaseStaticDemoPayload(decodedRunId);

        return (
          <ShowcasePayloadView
            runId={runId}
            payload={fallbackPayload}
            banner="api-fallback"
            renderMode="api_fallback"
          />
        );
      }

      return (
        <ShowcaseFailedShell runId={runId}>
          <div className="mt-6">
            <DemoPreviewNotAvailable />
          </div>
        </ShowcaseFailedShell>
      );
    }
  }
}
