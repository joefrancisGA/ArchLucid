import { AUTH_SIGNIN_PATH } from "@/lib/auth-operator-route-paths";
import { readServerApiBaseUrlFromEnv } from "@/lib/legacy-arch-env";
import { MARKETING_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";

export type ExecDigestSponsorDeepLinkHighlightedRun = {
  readonly runIdHex: string;
  readonly significanceScore: number;
  readonly caption?: string | null;
};

export type ExecDigestSponsorDeepLinkView = {
  readonly target: string;
  readonly weekLabel: string;
  readonly committedManifestsInWeek?: number | null;
  readonly topRuns: readonly ExecDigestSponsorDeepLinkHighlightedRun[];
  readonly complianceDriftMarkdown?: string | null;
  readonly findingsDeltaSummary?: string | null;
  readonly decisionNeededMarkdown?: string | null;
  readonly runIdHex?: string | null;
  readonly runSummaryMarkdown?: string | null;
  readonly signInUrl: string;
};

type ExecDigestSponsorDeepLinkViewResponse = {
  target?: string;
  weekLabel?: string;
  committedManifestsInWeek?: number | null;
  topRuns?: ExecDigestSponsorDeepLinkHighlightedRunResponse[];
  complianceDriftMarkdown?: string | null;
  findingsDeltaSummary?: string | null;
  decisionNeededMarkdown?: string | null;
  runIdHex?: string | null;
  runSummaryMarkdown?: string | null;
  signInUrl?: string;
};

type ExecDigestSponsorDeepLinkHighlightedRunResponse = {
  runIdHex?: string;
  significanceScore?: number;
  caption?: string | null;
};

export async function fetchExecDigestSponsorDeepLinkView(
  token: string,
  runIdHex?: string,
): Promise<ExecDigestSponsorDeepLinkView | null> {
  const trimmedToken = token.trim();
  if (!trimmedToken)
    return null;

  const apiBase = readServerApiBaseUrlFromEnv().replace(/\/$/, "");
  const url = new URL(`${apiBase}/v1.0/notifications/exec-digest/sponsor-view`);
  url.searchParams.set("token", trimmedToken);

  if (runIdHex?.trim())
    url.searchParams.set("runId", runIdHex.trim().replace(/-/g, ""));

  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(MARKETING_UPSTREAM_FETCH_TIMEOUT_MS),
  });

  if (response.status === 404)
    return null;

  if (!response.ok)
    throw new Error(`Sponsor digest link fetch failed with status ${response.status}.`);

  const payload = (await response.json()) as ExecDigestSponsorDeepLinkViewResponse;
  return mapResponse(payload);
}

function mapResponse(payload: ExecDigestSponsorDeepLinkViewResponse): ExecDigestSponsorDeepLinkView {
  return {
    target: payload.target ?? "",
    weekLabel: payload.weekLabel ?? "",
    committedManifestsInWeek: payload.committedManifestsInWeek,
    topRuns: (payload.topRuns ?? []).map((run) => ({
      runIdHex: run.runIdHex ?? "",
      significanceScore: run.significanceScore ?? 0,
      caption: run.caption,
    })),
    complianceDriftMarkdown: payload.complianceDriftMarkdown,
    findingsDeltaSummary: payload.findingsDeltaSummary,
    decisionNeededMarkdown: payload.decisionNeededMarkdown,
    runIdHex: payload.runIdHex,
    runSummaryMarkdown: payload.runSummaryMarkdown,
    signInUrl: normalizeSignInUrl(payload.signInUrl),
  };
}

/** API historically emitted `/auth/sign-in`; Next operator route is `/auth/signin`. */
function normalizeSignInUrl(url: string | undefined): string {
  if (!url?.trim())
    return AUTH_SIGNIN_PATH;

  return url.replace(/\/auth\/sign-in\/?(?=[?#]|$)/i, AUTH_SIGNIN_PATH);
}
