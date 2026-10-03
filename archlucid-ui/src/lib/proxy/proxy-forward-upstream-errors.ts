import { NextResponse } from "next/server";

import { INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE } from "@/lib/infra-evidence/infra-evidence-mermaid-png-unavailable";
import {
  logProxyDiagnostic,
  respondWithProxyProblem,
} from "@/lib/proxy/proxy-problem-response";
import { formatProxyUpstreamUnreachableDetail, isProxyUpstreamTimeoutFailure } from "@/lib/proxy-upstream-unreachable-detail";

import type { ForwardMethod } from "./proxy-forward-types";

type UpstreamFetchFailureOptions = {
  readonly method: ForwardMethod;
  readonly pathForLog: string;
  readonly correlationId: string;
  readonly timeoutMs: number;
  readonly causeMessage: string;
  readonly timeoutKind?: string;
};

/** Maps upstream fetch failures to a 502 problem response with consistent diagnostics. */
export function respondWithUpstreamFetchFailure(options: UpstreamFetchFailureOptions): NextResponse {
  const { method, pathForLog, correlationId, timeoutMs, causeMessage, timeoutKind } = options;
  const detail = formatProxyUpstreamUnreachableDetail({
    method,
    path: pathForLog,
    timeoutMs,
    causeMessage,
  });

  logProxyDiagnostic("upstream_fetch_failed", {
    method,
    path: pathForLog,
    message: causeMessage,
    timeoutMs,
    timeoutKind,
    timedOut: isProxyUpstreamTimeoutFailure(causeMessage) ? 1 : 0,
    correlationId,
  });

  return respondWithProxyProblem(
    502,
    {
      type: "about:blank",
      title: "Upstream API unreachable",
      status: 502,
      detail,
      instance: `${method} /${pathForLog}`,
      upstreamMethod: method,
      upstreamPath: pathForLog,
      upstreamTimeoutMs: timeoutMs,
      supportHint:
        "Confirm the ArchLucid API is running and reachable from this machine. Check ARCHLUCID_API_BASE_URL and see docs/runbooks/TROUBLESHOOTING.md.",
    },
    correlationId,
  );
}

const UPSTREAM_PROBLEM_BODY_MAX_CHARS = 8192;
const UPSTREAM_LOG_FRAGMENT_MAX_CHARS = 240;

/** Matches InfraEvidenceSnapshotMermaidService when compiled Mermaid text is blank. */
const MERMAID_EXPORT_SOURCE_UNAVAILABLE_DETAIL =
  "Mermaid source is unavailable for the requested mode." as const;

const MERMAID_EXPORT_PNG_RASTERIZER_REASON =
  "The diagram loaded. This 400 is only the server PNG file: Graphviz fdp did not return a PNG, and Mermaid CLI did not rasterize one either (often because ArchLucid:MermaidCli:Enabled is false). The on-screen diagram is unchanged, and the browser can still save a PNG from that SVG." as const;

const MERMAID_EXPORT_PNG_SOURCE_REASON =
  "This 400 means that mode had no Mermaid text to rasterize. The diagram JSON can still be HTTP 200 with an empty Mermaid field." as const;

export type UpstreamProblemSummary = {
  readonly title?: string;
  readonly detail?: string;
};

function sanitizeLogFragment(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();

  if (collapsed.length <= UPSTREAM_LOG_FRAGMENT_MAX_CHARS) {
    return collapsed;
  }

  return `${collapsed.slice(0, UPSTREAM_LOG_FRAGMENT_MAX_CHARS - 1)}…`;
}

/** Reads a short problem title/detail from a JSON error body without consuming the response. */
export async function readUpstreamProblemSummary(
  upstream: Response,
): Promise<UpstreamProblemSummary | undefined> {
  const contentType = upstream.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("json")) {
    return undefined;
  }

  const declaredLength = Number(upstream.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > UPSTREAM_PROBLEM_BODY_MAX_CHARS) {
    return undefined;
  }

  let text: string;

  try {
    text = await upstream.clone().text();
  } catch {
    return undefined;
  }

  if (text.length === 0 || text.length > UPSTREAM_PROBLEM_BODY_MAX_CHARS) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }

  if (parsed === null || typeof parsed !== "object") {
    return undefined;
  }

  const record = parsed as Record<string, unknown>;
  const title = typeof record.title === "string" ? sanitizeLogFragment(record.title) : undefined;
  const detail = typeof record.detail === "string" ? sanitizeLogFragment(record.detail) : undefined;

  if ((title === undefined || title.length === 0) && (detail === undefined || detail.length === 0)) {
    return undefined;
  }

  return {
    title: title && title.length > 0 ? title : undefined,
    detail: detail && detail.length > 0 ? detail : undefined,
  };
}

/** Plain-language reason for an inventory diagram PNG export 400, when the upstream detail is recognized. */
export function explainMermaidExportPngFailure(
  pathForLog: string,
  status: number,
  detail: string | undefined,
): string | undefined {
  if (status !== 400 || !pathForLog.includes("mermaid/export.png") || detail === undefined) {
    return undefined;
  }

  if (detail.includes(INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE)) {
    return MERMAID_EXPORT_PNG_RASTERIZER_REASON;
  }

  if (detail.includes(MERMAID_EXPORT_SOURCE_UNAVAILABLE_DETAIL)) {
    return MERMAID_EXPORT_PNG_SOURCE_REASON;
  }

  return undefined;
}

/** Logs non-success upstream responses for operator triage. */
export async function logUpstreamNonSuccess(
  method: ForwardMethod,
  pathForLog: string,
  status: number,
  correlationId: string,
  upstream?: Response,
): Promise<void> {
  const problem = upstream === undefined ? undefined : await readUpstreamProblemSummary(upstream);
  const reason = explainMermaidExportPngFailure(pathForLog, status, problem?.detail);

  logProxyDiagnostic("upstream_non_success", {
    method,
    path: pathForLog,
    status,
    correlationId,
    title: problem?.title,
    detail: problem?.detail,
    reason,
  });
}
