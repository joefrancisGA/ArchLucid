import { afterEach, describe, expect, it } from "vitest";

import {
  appSiteHref,
  isSplitSiteHostingEnabled,
  publicSiteHref,
  resolveAppSiteOrigin,
  resolvePublicSiteOrigin,
} from "@/lib/site-urls";

const ENV_KEYS = [
  "ARCHLUCID_PUBLIC_SITE_URL",
  "ARCHLUCID_APP_SITE_URL",
  "NEXT_PUBLIC_ARCHLUCID_SITE_URL",
  "NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL",
] as const;

function clearSiteUrlEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearSiteUrlEnv();
});

describe("site-urls", () => {
  it("keeps relative hrefs when split hosting is unset", () => {
    clearSiteUrlEnv();

    expect(resolvePublicSiteOrigin()).toBeNull();
    expect(resolveAppSiteOrigin()).toBeNull();
    expect(isSplitSiteHostingEnabled()).toBe(false);
    expect(publicSiteHref("/welcome")).toBe("/welcome");
    expect(appSiteHref("/auth/signin")).toBe("/auth/signin");
  });

  it("keeps relative hrefs when public and app origins match", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net/";
    process.env.ARCHLUCID_APP_SITE_URL = "https://archlucid.net";

    expect(isSplitSiteHostingEnabled()).toBe(false);
    expect(publicSiteHref("welcome")).toBe("/welcome");
    expect(appSiteHref("/auth/signin")).toBe("/auth/signin");
  });

  it("emits absolute cross-host hrefs when origins differ", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(isSplitSiteHostingEnabled()).toBe(true);
    expect(publicSiteHref("/welcome")).toBe("https://archlucid.net/welcome");
    expect(appSiteHref("/auth/signin")).toBe("https://app.archlucid.net/auth/signin");
    expect(appSiteHref("auth/signin?returnUrl=%2F")).toBe(
      "https://app.archlucid.net/auth/signin?returnUrl=%2F",
    );
  });

  it("prefers runtime env over NEXT_PUBLIC fallbacks", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SITE_URL = "https://baked.example";
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://runtime.example";
    process.env.NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL = "https://app-baked.example";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app-runtime.example";

    expect(resolvePublicSiteOrigin()).toBe("https://runtime.example");
    expect(resolveAppSiteOrigin()).toBe("https://app-runtime.example");
  });

  it("passes through already-absolute hrefs", () => {
    process.env.ARCHLUCID_PUBLIC_SITE_URL = "https://archlucid.net";
    process.env.ARCHLUCID_APP_SITE_URL = "https://app.archlucid.net";

    expect(publicSiteHref("https://other.example/x")).toBe("https://other.example/x");
    expect(appSiteHref("https://other.example/y")).toBe("https://other.example/y");
  });
});
