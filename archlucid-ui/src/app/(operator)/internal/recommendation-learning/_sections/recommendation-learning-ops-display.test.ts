import { describe, expect, it } from "vitest";

import {
  deployEnvironmentStatusTagKind,
  profileStateLabel,
  profileStateStatusTagKind,
  profileVersionStatusTagKind,
  resolveDeployEnvironmentLabel,
  validationCheckStatusTagKind,
} from "@/app/(operator)/internal/recommendation-learning/_sections/recommendation-learning-ops-display";

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

  it("maps profile and validation status tag kinds", () => {
    expect(profileStateStatusTagKind("Active")).toBe("ready");
    expect(profileStateStatusTagKind("InsufficientData")).toBe("needs-attention");
    expect(profileVersionStatusTagKind(true)).toBe("ready");
    expect(validationCheckStatusTagKind("Pass")).toBe("ready");
    expect(validationCheckStatusTagKind("Fail")).toBe("blocked");
    expect(deployEnvironmentStatusTagKind()).toBe("neutral");
  });
});
