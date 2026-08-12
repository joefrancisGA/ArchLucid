import { afterEach, describe, expect, it, vi } from "vitest";

// Digest preferences are no longer loaded here — the schedule editor lives on the Digests hub.
vi.mock("@/lib/api", () => ({
  tryGetTenantTrialStatus: vi.fn(() => Promise.resolve(null)),
}));

describe("loadTenantSettingsPageData", () => {
  const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
  const originalStaticOperator = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
  const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

  afterEach(() => {
    vi.resetModules();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }

    if (originalStaticOperator !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStaticOperator;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    } else {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    }
  });

  // Regression guard: TB-643 made isBuyerPolishedOperatorShellEnv() default to true for every
  // authenticated deploy, which previously blanked this page for all non-full-operator shells
  // (the sidebar "Settings" link's actual destination). The loader must stay visible by default.
  it("stays visible for the default authenticated shell (no demo flags set)", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    const { loadTenantSettingsPageData } = await import("./load-tenant-settings-page-data");
    const loaded = await loadTenantSettingsPageData();

    expect(loaded.mode).toBe("visible");
  });

  it("stays visible for full-operator shells", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    const { loadTenantSettingsPageData } = await import("./load-tenant-settings-page-data");
    const loaded = await loadTenantSettingsPageData();

    expect(loaded.mode).toBe("visible");
  });

  it("hides only for public demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const { loadTenantSettingsPageData } = await import("./load-tenant-settings-page-data");
    const loaded = await loadTenantSettingsPageData();

    expect(loaded.mode).toBe("hidden");
  });

  it("hides only for packaged static-operator demo builds", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "true";

    const { loadTenantSettingsPageData } = await import("./load-tenant-settings-page-data");
    const loaded = await loadTenantSettingsPageData();

    expect(loaded.mode).toBe("hidden");
  });
});
