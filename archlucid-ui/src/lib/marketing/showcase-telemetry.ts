import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";
import { ensureAppInsights } from "@/lib/telemetry";

export type ShowcaseRenderMode = "static" | "api" | "api_fallback" | "failed";

export type ShowcaseDemoPreviewTelemetry = {
  readonly scenario: string;
  readonly renderMode: ShowcaseRenderMode;
};

export type ShowcaseFunnelAction =
  | "quick_nav_review"
  | "quick_nav_signed_record"
  | "quick_nav_finding"
  | "quick_nav_sign_in"
  | "finding_open"
  | "evidence_trace_open"
  | "demo_request_cta"
  | "signup_cta";

type ClarityApi = (action: string, ...args: string[]) => void;

type ShowcaseTelemetryProps = {
  readonly scenario: string;
  readonly renderMode: ShowcaseRenderMode;
};

function isMarketingAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;

  if (process.env.NEXT_PUBLIC_ARCHLUCID_MARKETING_ANALYTICS_DISABLED === "true") return false;

  return window.localStorage.getItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY) === "granted";
}

function recordShowcaseClarityEvent(eventName: string, scenario: string, renderMode: ShowcaseRenderMode): void {
  if (!isMarketingAnalyticsAllowed()) return;

  const clarity: ClarityApi | undefined = (window as Window & { clarity?: ClarityApi }).clarity;

  if (typeof clarity !== "function") return;

  clarity("set", "showcase_scenario", scenario);
  clarity("set", "showcase_render_mode", renderMode);
  clarity("event", eventName);
}

function trackShowcaseAppInsights(
  eventName: string,
  properties: Record<string, string>,
): void {
  if (!isMarketingAnalyticsAllowed()) return;

  void ensureAppInsights().then((ai) => {
    if (ai === null) return;

    ai.trackEvent({ name: eventName }, properties);
  });
}

/** Page load: {@code showcase_viewed} + render-mode dimension (TB-891 / TB-978). */
export function recordShowcaseViewed(props: ShowcaseTelemetryProps): void {
  const scenario = props.scenario.trim();

  if (scenario.length === 0) return;

  recordShowcaseClarityEvent("showcase_viewed", scenario, props.renderMode);
  trackShowcaseAppInsights("showcase_viewed", {
    scenario,
    renderMode: props.renderMode,
  });
  trackShowcaseAppInsights("showcase_render_mode", {
    scenario,
    renderMode: props.renderMode,
  });
}

/** Funnel companion events tagged with scenario (TB-978). */
export function recordShowcaseFunnelEvent(
  action: ShowcaseFunnelAction,
  props: ShowcaseTelemetryProps,
): void {
  const scenario = props.scenario.trim();

  if (scenario.length === 0) return;

  const eventName = `showcase_${action}`;

  recordShowcaseClarityEvent(eventName, scenario, props.renderMode);
  trackShowcaseAppInsights(eventName, {
    scenario,
    renderMode: props.renderMode,
    action,
  });
}

/** Canonical scenario slug from showcase route runId segment. */
export function resolveShowcaseScenarioSlug(runId: string): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) return "unknown";

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}
