import { afterEach, describe, expect, it } from "vitest";

import { decideHostGateRedirect, isMarketingOnlyPath, isOperatorPath } from "@/lib/host-gate";
import { LEGACY_SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { LEGACY_GETTING_STARTED_PATH } from "@/lib/getting-started-help-guide-content";
import { LEGACY_ONBOARDING_PATH } from "@/lib/first-review-guide-route";
import {
  LEGACY_ALERT_ROUTING_PATH,
  LEGACY_GOVERNANCE_RESOLUTION_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  LEGACY_SPONSOR_REPORT_ROOT_PATH,
  RETIRED_PILOT_OUTCOMES_PATH,
  RETIRED_SPONSOR_SUMMARY_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { RETIRED_SETTINGS_ALERTS_TRAFFIC_PATH } from "@/lib/ui-route-traffic-legacy-settings-alerts";
import { GOVERNANCE_DASHBOARD_TRAFFIC_PATH } from "@/lib/ui-route-traffic-governance-dashboard";
import { SPONSOR_SCORECARD_TRAFFIC_PATH } from "@/lib/ui-route-traffic-sponsor-scorecard";
import {
  RETIRED_LOGIN_BOOKMARK_PATH,
  RETIRED_ONBOARD_BOOKMARK_PATH,
  RETIRED_ONBOARDING_START_BOOKMARK_PATH,
  RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH,
} from "@/lib/ui-route-traffic-retired-redirect-shims";

const ENV_KEYS = [
  "ARCHLUCID_PUBLIC_SITE_URL",
  "ARCHLUCID_APP_SITE_URL",
  "NEXT_PUBLIC_ARCHLUCID_SITE_URL",
  "NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL",
] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("host-gate path classifiers", () => {
  it("treats operator home and reviews as operator paths", () => {
    expect(isOperatorPath("/")).toBe(true);
    expect(isOperatorPath("/architecture/reviews")).toBe(true);
    expect(isOperatorPath("/architecture/reviews/abc")).toBe(true);
    expect(isOperatorPath("/auth/signin")).toBe(true);
    expect(isOperatorPath("/welcome")).toBe(false);
  });

  it("treats legacy bookmark paths as operator paths for split-host handoff", () => {
    expect(isOperatorPath("/reviews")).toBe(true);
    expect(isOperatorPath("/reviews/abc")).toBe(true);
    expect(isOperatorPath("/policy-packs")).toBe(true);
    expect(isOperatorPath("/signed-records/demo")).toBe(true);
    expect(isOperatorPath(RETIRED_LOGIN_BOOKMARK_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_ONBOARD_BOOKMARK_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_ONBOARDING_START_BOOKMARK_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_PILOT_OUTCOMES_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_SPONSOR_SUMMARY_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_ONBOARDING_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_GETTING_STARTED_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_ALERT_ROUTING_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_GOVERNANCE_RESOLUTION_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)).toBe(true);
    expect(isOperatorPath(LEGACY_SPONSOR_REPORT_ROOT_PATH)).toBe(true);
    expect(isOperatorPath(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)).toBe(true);
    expect(isOperatorPath(RETIRED_SETTINGS_ALERTS_TRAFFIC_PATH)).toBe(true);
    expect(isOperatorPath("/dashboard")).toBe(true);
    expect(isOperatorPath("/portfolio")).toBe(true);
    expect(isOperatorPath(GOVERNANCE_DASHBOARD_TRAFFIC_PATH)).toBe(true);
    expect(isOperatorPath(SPONSOR_SCORECARD_TRAFFIC_PATH)).toBe(true);
    expect(isOperatorPath("/admin/users")).toBe(true);
    expect(isOperatorPath("/health")).toBe(true);
    expect(isOperatorPath("/replay")).toBe(true);
    expect(isMarketingOnlyPath(LEGACY_ALERT_ROUTING_PATH)).toBe(false);
  });

  it("treats welcome/pricing/signup as marketing-only", () => {
    expect(isMarketingOnlyPath("/welcome")).toBe(true);
    expect(isMarketingOnlyPath("/pricing")).toBe(true);
    expect(isMarketingOnlyPath("/signup")).toBe(true);
    expect(isMarketingOnlyPath("/faq")).toBe(true);
    expect(isMarketingOnlyPath("/architecture/reviews")).toBe(false);
  });
});

describe("decideHostGateRedirect", () => {
  it("is a no-op when split hosting is unset", () => {
    clearEnv();

    expect(
      decideHostGateRedirect({ hostHeader: "localhost:3000", pathname: "/architecture/reviews", search: "" }),
    ).toEqual({ kind: "next" });
  });

  it("redirects marketing-host operator paths to the app origin", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(
      decideHostGateRedirect({
        hostHeader: "archlucid.net",
        pathname: "/architecture/reviews",
        search: "?x=1",
      }),
    ).toEqual({ kind: "redirect", location: "https://app.archlucid.net/architecture/reviews?x=1" });
  });

  it("redirects marketing-host / to /welcome on the public origin", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(
      decideHostGateRedirect({ hostHeader: "archlucid.net", pathname: "/", search: "" }),
    ).toEqual({ kind: "redirect", location: "https://archlucid.net/welcome" });
  });

  it("redirects app-host marketing paths to the public origin", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(
      decideHostGateRedirect({
        hostHeader: "app.archlucid.net",
        pathname: "/welcome",
        search: "",
      }),
    ).toEqual({ kind: "redirect", location: "https://archlucid.net/welcome" });
  });

  it("leaves marketing paths on the marketing host alone", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(
      decideHostGateRedirect({
        hostHeader: "archlucid.net",
        pathname: "/pricing",
        search: "",
      }),
    ).toEqual({ kind: "next" });
  });

  it("redirects marketing-host retired bookmark paths to the app origin", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(
      decideHostGateRedirect({
        hostHeader: "archlucid.net",
        pathname: RETIRED_LOGIN_BOOKMARK_PATH,
        search: "?returnUrl=%2Farchitecture%2Freviews",
      }),
    ).toEqual({
      kind: "redirect",
      location: `https://app.archlucid.net${RETIRED_LOGIN_BOOKMARK_PATH}?returnUrl=%2Farchitecture%2Freviews`,
    });

    expect(
      decideHostGateRedirect({
        hostHeader: "archlucid.net",
        pathname: LEGACY_ALERT_ROUTING_PATH,
        search: "",
      }),
    ).toEqual({
      kind: "redirect",
      location: `https://app.archlucid.net${LEGACY_ALERT_ROUTING_PATH}`,
    });

    expect(
      decideHostGateRedirect({
        hostHeader: "archlucid.net",
        pathname: "/dashboard",
        search: "",
      }),
    ).toEqual({ kind: "redirect", location: "https://app.archlucid.net/dashboard" });
  });

  it("matches split hosts that differ only by port (local dual-origin)", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.ARCHLUCID_APP_SITE_URL = "http://localhost:3001";

    expect(
      decideHostGateRedirect({
        hostHeader: "localhost:3000",
        pathname: "/architecture/reviews",
        search: "",
      }),
    ).toEqual({ kind: "redirect", location: "http://localhost:3001/architecture/reviews" });

    expect(
      decideHostGateRedirect({
        hostHeader: "localhost:3001",
        pathname: "/welcome",
        search: "",
      }),
    ).toEqual({ kind: "redirect", location: "http://localhost:3000/welcome" });
  });
});
