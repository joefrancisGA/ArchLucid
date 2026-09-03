import { NextResponse } from "next/server";

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

/** Logs non-success upstream responses for operator triage. */
export function logUpstreamNonSuccess(
  method: ForwardMethod,
  pathForLog: string,
  status: number,
  correlationId: string,
): void {
  logProxyDiagnostic("upstream_non_success", {
    method,
    path: pathForLog,
    status,
    correlationId,
  });
}
