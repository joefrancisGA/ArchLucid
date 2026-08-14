import { afterEach, describe, expect, it } from "vitest";

import { decideHostGateRedirect, isMarketingOnlyPath, isOperatorPath } from "@/lib/host-gate";
import { LEGACY_ONBOARDING_PATH } from "@/lib/first-review-guide-route";
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
    expect(isOperatorPath(LEGACY_ONBOARDING_PATH)).toBe(true);
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
  });
});
