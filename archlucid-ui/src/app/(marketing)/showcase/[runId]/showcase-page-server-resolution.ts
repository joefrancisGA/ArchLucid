import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { getShowcaseStaticDemoPayload } from "@/lib/showcase-static-demo";
import {
  decodeShowcaseRunId,
  hasCuratedShowcaseStaticPayload,
  isShowcaseStaticFirstRunId,
} from "@/lib/showcase-page-resolution";
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

    if (payload == null || typeof payload !== "object" || payload.run == null || payload.manifest == null) {
      return { kind: "invalid" };
    }

    if (typeof payload.manifest.manifestId !== "string" || payload.manifest.manifestId.trim().length === 0) {
      return { kind: "invalid" };
    }

    if (!Array.isArray(payload.artifacts) || !Array.isArray(payload.pipelineTimeline)) {
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
