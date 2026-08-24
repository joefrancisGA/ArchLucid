import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyDevRoleOverrideToPrincipal,
  cycleDevShellExperienceOverride,
  DEV_AGENT_EXECUTION_MODE_COOKIE,
  DEV_ROLE_OVERRIDE_COOKIE,
  DEV_SHELL_EXPERIENCE_COOKIE,
  parseDevAgentExecutionModeOverride,
  parseDevRoleOverride,
  parseDevShellExperienceOverride,
  persistDevAgentExecutionModeOverride,
  persistDevRoleOverride,
  persistDevShellExperienceOverride,
  readDevAgentExecutionModeOverrideFromDocument,
  readDevShellExperienceOverrideFromDocument,
  resolveEffectiveDevAgentExecutionMode,
} from "@/lib/dev-testing-overrides";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

describe("dev-testing-overrides", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    document.cookie = `${DEV_SHELL_EXPERIENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_AGENT_EXECUTION_MODE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  });

  it("parses shell and role override tokens", () => {
    expect(parseDevShellExperienceOverride("full-operator")).toBe("full-operator");
    expect(parseDevShellExperienceOverride("buyer")).toBe("buyer-polished");
    expect(parseDevRoleOverride("Auditor")).toBe("Auditor");
    expect(parseDevRoleOverride("Sponsor")).toBeNull();
    expect(parseDevAgentExecutionModeOverride("live")).toBe("Real");
    expect(parseDevAgentExecutionModeOverride("simulator")).toBe("Simulator");
  });

  it("persists shell override in a dev-only cookie", () => {
    persistDevShellExperienceOverride("full-operator");

    expect(readDevShellExperienceOverrideFromDocument()).toBe("full-operator");
  });

  it("cycles shell override buyer → full → build default", () => {
    expect(cycleDevShellExperienceOverride()).toBe("buyer-polished");
    expect(readDevShellExperienceOverrideFromDocument()).toBe("buyer-polished");

    expect(cycleDevShellExperienceOverride()).toBe("full-operator");
    expect(readDevShellExperienceOverrideFromDocument()).toBe("full-operator");

    expect(cycleDevShellExperienceOverride()).toBeNull();
    expect(readDevShellExperienceOverrideFromDocument()).toBeNull();
  });

  it("applies dev role override to the current principal read-model", () => {
    persistDevRoleOverride("Reader");

    const overridden = applyDevRoleOverrideToPrincipal(operatorNavOutsideProviderPrincipal);

    expect(overridden.primaryAppRole).toBe("Reader");
    expect(overridden.authorityRank).toBe(1);
    expect(overridden.hasEnterpriseOperatorSurfaces).toBe(false);
  });

  it("defaults agent execution mode to Real and persists simulator override", () => {
    expect(resolveEffectiveDevAgentExecutionMode(null)).toBe("Real");

    persistDevAgentExecutionModeOverride("Simulator");

    expect(readDevAgentExecutionModeOverrideFromDocument()).toBe("Simulator");
    expect(resolveEffectiveDevAgentExecutionMode(readDevAgentExecutionModeOverrideFromDocument())).toBe(
      "Simulator",
    );
  });
});
