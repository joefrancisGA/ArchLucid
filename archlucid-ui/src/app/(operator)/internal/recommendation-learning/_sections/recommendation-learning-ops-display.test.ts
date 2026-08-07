import { describe, expect, it } from "vitest";

import {
  profileStateLabel,
  resolveDeployEnvironmentLabel,
} from "@/app/(operator)/internal-operations/recommendation-learning/_sections/recommendation-learning-ops-display";

describe("recommendation-learning-ops-display", () => {
  it("maps profile state labels for operators", () => {
    expect(profileStateLabel("NotBuilt")).toBe("Not built");
    expect(profileStateLabel("InsufficientData")).toBe("Insufficient data");
  });

  it("prefers NEXT_PUBLIC_DEPLOY_ENV when set", () => {
    const previous = process.env.NEXT_PUBLIC_DEPLOY_ENV;
    process.env.NEXT_PUBLIC_DEPLOY_ENV = "Staging";

    expect(resolveDeployEnvironmentLabel()).toBe("Staging");

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_DEPLOY_ENV;
    } else {
      process.env.NEXT_PUBLIC_DEPLOY_ENV = previous;
    }
  });
});
