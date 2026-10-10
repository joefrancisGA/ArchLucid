import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload } from "@/lib/showcase-static-demo";
import {
  decodeShowcaseRunId,
  hasCuratedShowcaseStaticPayload,
  isShowcaseStaticFirstRunId,
} from "@/lib/showcase-page-resolution";
import { hasUsableMarketingRunExplanationCounts } from "@/lib/marketing/demo-preview-run-explanation-counts";
import type { ShowcaseRenderMode } from "@/lib/marketing/showcase-telemetry";

export const SHOWCASE_PAGE_REVALIDATE_SECONDS = 300;

export type ShowcaseFetchResult =
  | { kind: "ok"; payload: DemoCommitPagePreviewResponse }
  | { kind: "bad_json" }
  | { kind: "missing" }
  | { kind: "not_found" }
  | { kind: "http_error" }
  | { kind: "invalid" };

export type ShowcasePageRenderPlan =
  | {
      readonly kind: "payload";
      readonly runId: string;
      readonly payload: DemoCommitPagePreviewResponse;
      readonly banner: "static" | "api-fallback" | null;
      readonly renderMode: ShowcaseRenderMode;
    }
  | {
      readonly kind: "failed";
      readonly runId: string;
      readonly reason: "not-available" | "load-failed" | "bad-json";
    };

export function shouldServeShowcaseStaticOnly(): boolean {
  const a = process.env.SHOWCASE_STATIC_ONLY?.trim().toLowerCase();
  const b = process.env.NEXT_PUBLIC_SHOWCASE_STATIC_ONLY?.trim().toLowerCase();

  return a === "true" || a === "1" || b === "true" || b === "1";
}

export function resolveShowcaseApiBase(): string {
  if (shouldServeShowcaseStaticOnly()) {
    return "";
  }

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

function hasUsableShowcaseRunExplanation(payload: DemoCommitPagePreviewResponse): boolean {
  return hasUsableMarketingRunExplanationCounts(payload.runExplanation);
}

function isUsableShowcasePipelineTimelineRow(event: unknown): boolean {
  if (event === null || typeof event !== "object" || Array.isArray(event)) {
    return false;
  }

  const row = event as {
    eventId?: unknown;
    occurredUtc?: unknown;
    eventType?: unknown;
  };

  if (typeof row.eventId !== "string" || row.eventId.trim().length === 0) {
    return false;
  }

  if (typeof row.occurredUtc !== "string" || row.occurredUtc.trim().length === 0) {
    return false;
  }

  if (typeof row.eventType !== "string" || row.eventType.trim().length === 0) {
    return false;
  }

  return true;
}

function hasUsableShowcasePipelineTimeline(payload: DemoCommitPagePreviewResponse): boolean {
  if (!Array.isArray(payload.pipelineTimeline) || payload.pipelineTimeline.length === 0) {
    return false;
  }

  const seenEventIds = new Set<string>();

  for (const event of payload.pipelineTimeline) {
    if (!isUsableShowcasePipelineTimelineRow(event)) {
      return false;
    }

    const eventId = (event as { eventId: string }).eventId.trim();

    if (seenEventIds.has(eventId)) {
      return false;
    }

    seenEventIds.add(eventId);
  }

  return true;
}

export async function fetchShowcasePayload(
  url: string,
): Promise<ShowcaseFetchResult> {
  try {
    const response = await fetch(url, {
      next: { revalidate: SHOWCASE_PAGE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(MARKETING_UPSTREAM_FETCH_TIMEOUT_MS),
    });

    if (response.status === 404) {
      return { kind: "not_found" };
    }

    if (!response.ok) {
      return { kind: "http_error" };
    }

    let payload: DemoCommitPagePreviewResponse;

    try {
      payload = (await response.json()) as DemoCommitPagePreviewResponse;
    } catch {
      return { kind: "bad_json" };
    }

    if (
      payload == null ||
      typeof payload !== "object" ||
      payload.run == null ||
      typeof payload.run.runId !== "string" ||
      payload.run.runId.trim().length === 0 ||
      payload.manifest == null
    ) {
      return { kind: "invalid" };
    }

    if (typeof payload.manifest.manifestId !== "string" || payload.manifest.manifestId.trim().length === 0) {
      return { kind: "invalid" };
    }

    if (!Array.isArray(payload.artifacts) || payload.artifacts.length === 0 || !hasUsableShowcasePipelineTimeline(payload)) {
      return { kind: "invalid" };
    }

    if (!hasUsableShowcaseRunExplanation(payload)) {
      return { kind: "invalid" };
    }

    return { kind: "ok", payload };
  } catch {
    return { kind: "missing" };
  }
}

function staticPayloadPlan(
  runId: string,
  decodedRunId: string,
  banner: "static" | "api-fallback",
  renderMode: ShowcaseRenderMode,
): ShowcasePageRenderPlan {
  return {
    kind: "payload",
    runId,
    payload: getShowcaseStaticDemoPayload(decodedRunId),
    banner,
    renderMode,
  };
}

/** Resolves live API vs static-demo SSR and maps fetch outcomes to a render plan. */
export async function resolveShowcasePageRenderPlan(runId: string): Promise<ShowcasePageRenderPlan> {
  const decodedRunId = decodeShowcaseRunId(runId);
  const base = resolveShowcaseApiBase();

  if (!base || isShowcaseStaticFirstRunId(decodedRunId)) {
    return staticPayloadPlan(runId, decodedRunId, "static", "static");
  }

  const encoded = encodeURIComponent(decodedRunId);
  const url = `${base}/v1/marketing/showcase/${encoded}`;
  const bundle = await fetchShowcasePayload(url);

  switch (bundle.kind) {
    case "not_found":
    case "invalid": {
      if (hasCuratedShowcaseStaticPayload(decodedRunId)) {
        return staticPayloadPlan(runId, decodedRunId, "api-fallback", "api_fallback");
      }

      return { kind: "failed", runId, reason: "not-available" };
    }

    case "ok":
      return {
        kind: "payload",
        runId,
        payload: bundle.payload,
        banner: null,
        renderMode: "api",
      };

    case "bad_json": {
      if (hasCuratedShowcaseStaticPayload(decodedRunId)) {
        return staticPayloadPlan(runId, decodedRunId, "api-fallback", "api_fallback");
      }

      return { kind: "failed", runId, reason: "bad-json" };
    }

    case "http_error":
    case "missing": {
      if (hasCuratedShowcaseStaticPayload(decodedRunId)) {
        return staticPayloadPlan(runId, decodedRunId, "api-fallback", "api_fallback");
      }

      return { kind: "failed", runId, reason: "not-available" };
    }
  }
}
