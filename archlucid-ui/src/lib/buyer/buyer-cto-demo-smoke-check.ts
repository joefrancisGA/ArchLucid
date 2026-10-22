import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type CtoDemoSmokeCheckResult = {
  readonly stepLabel: string;
  readonly href: string;
  readonly ok: boolean;
  readonly statusCode: number | null;
};

export function getFirstValueReportPdfProxyPath(runId: string): string {
  return `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report.pdf`;
}

function resolveCheckUrl(href: string, origin: string): string {
  const trimmed = href.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const base = origin.trim().replace(/\/$/, "");

  if (base.length === 0) {
    return trimmed;
  }

  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function isOkStatus(status: number): boolean {
  return status >= 200 && status < 400;
}

async function headCheck(label: string, href: string, origin: string): Promise<CtoDemoSmokeCheckResult> {
  const url = resolveCheckUrl(href, origin);

  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store", credentials: "same-origin" });

    if (response.status === 405 || response.status === 401) {
      return { stepLabel: label, href, ok: true, statusCode: response.status };
    }

    return {
      stepLabel: label,
      href,
      ok: isOkStatus(response.status),
      statusCode: response.status,
    };
  } catch {
    return { stepLabel: label, href, ok: false, statusCode: null };
  }
}

/** Presenter-only pre-call fetch health check for the five-step golden journey. */
export async function runBuyerCtoDemoSmokeCheck(origin?: string): Promise<readonly CtoDemoSmokeCheckResult[]> {
  const resolvedOrigin =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const stepChecks = await Promise.all(
    BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, index) =>
      headCheck(`Step ${index + 1}: ${def.label}`, def.href, resolvedOrigin),
    ),
  );

  const boardPackCheck = await headCheck(
    "Board-pack PDF",
    getFirstValueReportPdfProxyPath(SHOWCASE_STATIC_DEMO_RUN_ID),
    resolvedOrigin,
  );

  return [...stepChecks, boardPackCheck];
}
