import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config";
import {
  applyNavShellPresetPackagingFilter,
  BUYER_POLISHED_SHELL_OMIT_NAV_HREFS,
  PUBLIC_DEMO_THIN_SHELL_OMIT_NAV_HREFS,
  resolveNavShellPresetId,
} from "@/lib/nav-shell-preset";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: vi.fn(actual.isBuyerPolishedOperatorShellEnv),
    isNextPublicDemoMode: vi.fn(actual.isNextPublicDemoMode),
  };
});

import {
  isBuyerPolishedOperatorShellEnv,
  isNextPublicDemoMode,
} from "@/lib/demo-ui-env";

const SAMPLE_LINKS: NavLinkItem[] = [
  {
    href: "/governance/alerts",
    label: "Alerts",
    title: "Alerts",
    tier: "extended",
    requiredAuthority: "ReadAuthority",
  },
  {
    href: "/administration/api-keys",
    label: "API keys",
    title: "API keys",
    tier: "advanced",
    requiredAuthority: "AdminAuthority",
  },
];

describe("nav-shell-preset (TB-2233)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves full preset when no demo/buyer flags are set", () => {
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(false);
    vi.mocked(isNextPublicDemoMode).mockReturnValue(false);

    expect(resolveNavShellPresetId()).toBe("full");
    expect(applyNavShellPresetPackagingFilter(SAMPLE_LINKS, "full")).toEqual(SAMPLE_LINKS);
  });

  it("omits buyer-polished packaging hrefs only for buyer-polished preset", () => {
    const filtered = applyNavShellPresetPackagingFilter(SAMPLE_LINKS, "buyer-polished");

    expect(filtered.some((link) => link.href === "/governance/alerts")).toBe(true);
    expect(filtered.some((link) => link.href === "/administration/api-keys")).toBe(false);
    expect(BUYER_POLISHED_SHELL_OMIT_NAV_HREFS.has("/administration/api-keys")).toBe(true);
  });

  it("omits public-demo-thin hrefs for demo preset", () => {
    const filtered = applyNavShellPresetPackagingFilter(SAMPLE_LINKS, "public-demo-thin");

    expect(filtered.some((link) => link.href === "/governance/alerts")).toBe(false);
    expect(PUBLIC_DEMO_THIN_SHELL_OMIT_NAV_HREFS.has("/governance/alerts")).toBe(true);
  });

  it("resolves buyer-polished preset when buyer shell env is active", () => {
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(true);
    vi.mocked(isNextPublicDemoMode).mockReturnValue(false);

    expect(resolveNavShellPresetId()).toBe("buyer-polished");
  });

  it("resolves public-demo-thin preset when only demo static operator is active", () => {
    vi.mocked(isBuyerPolishedOperatorShellEnv).mockReturnValue(false);
    vi.mocked(isNextPublicDemoMode).mockReturnValue(false);
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "1");

    expect(resolveNavShellPresetId()).toBe("public-demo-thin");
  });
});
