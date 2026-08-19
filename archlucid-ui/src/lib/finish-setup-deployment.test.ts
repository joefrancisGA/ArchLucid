import { afterEach, describe, expect, it } from "vitest";

import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";

describe("isSelfHostedDeploymentEnv", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSelfHosted = process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSelfHosted === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = originalSelfHosted;
    }
  });

  it("defaults to self-hosted in development when unset", () => {
    delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    process.env.NODE_ENV = "development";

    expect(isSelfHostedDeploymentEnv()).toBe(true);
  });

  it("defaults to hosted SaaS in production when unset", () => {
    delete process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED;
    process.env.NODE_ENV = "production";

    expect(isSelfHostedDeploymentEnv()).toBe(false);
  });

  it("honors NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED override", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_ARCHLUCID_SELF_HOSTED = "true";

    expect(isSelfHostedDeploymentEnv()).toBe(true);
  });
});
