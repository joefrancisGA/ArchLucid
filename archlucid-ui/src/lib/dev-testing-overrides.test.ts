import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyDevRoleOverrideToPrincipal,
  cycleDevShellExperienceOverride,
  DEV_AGENT_EXECUTION_MODE_COOKIE,
  DEV_EMPLOYEE_API_ACTOR_ROLE,
  DEV_ROLE_OVERRIDE_COOKIE,
  DEV_SHELL_EXPERIENCE_COOKIE,
  isDevEmployeeRoleOverrideActive,
  parseDevAgentExecutionModeOverride,
  parseDevRoleOverride,
  parseDevShellExperienceOverride,
  persistDevAgentExecutionModeOverride,
  persistDevRoleOverride,
  persistDevShellExperienceOverride,
  readDevAgentExecutionModeOverrideFromDocument,
  readDevShellExperienceOverrideFromDocument,
  resolveDevRoleOverrideApiActorRole,
  resolveEffectiveDevAgentExecutionMode,
} from "@/lib/dev-testing-overrides";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY } from "@/lib/role-shaped-nav-density";
import { ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION, isArchLucidVendorStaffPrincipal } from "@/lib/vendor-staff-principal";

describe("dev-testing-overrides", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    document.cookie = `${DEV_SHELL_EXPERIENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_AGENT_EXECUTION_MODE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    window.localStorage.removeItem(ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY);
  });

  it("parses shell and role override tokens", () => {
    expect(parseDevShellExperienceOverride("full-operator")).toBe("full-operator");
    expect(parseDevShellExperienceOverride("buyer")).toBe("buyer-polished");
    expect(parseDevRoleOverride("Employee")).toBe("Employee");
    expect(parseDevRoleOverride("Auditor")).toBe("Auditor");
    expect(parseDevRoleOverride("Sponsor")).toBeNull();
    expect(parseDevAgentExecutionModeOverride("live")).toBe("Real");
    expect(parseDevAgentExecutionModeOverride("simulator")).toBe("Simulator");
  });

  it("maps Employee to PlatformOperator for DevelopmentBypass API shaping", () => {
    expect(resolveDevRoleOverrideApiActorRole("Employee")).toBe(DEV_EMPLOYEE_API_ACTOR_ROLE);
    expect(resolveDevRoleOverrideApiActorRole("Admin")).toBe("Admin");
  });

  it("builds vendor-staff principal claims for Employee override", () => {
    persistDevRoleOverride("Employee");

    const overridden = applyDevRoleOverrideToPrincipal(operatorNavOutsideProviderPrincipal);

    expect(overridden.roleClaimValues).toContain(DEV_EMPLOYEE_API_ACTOR_ROLE);
    expect(overridden.permissionClaimValues).toContain(ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION);
    expect(isArchLucidVendorStaffPrincipal(overridden)).toBe(true);
    expect(overridden.authorityRank).toBe(3);
    expect(overridden.hasCommittedArchitectureReview).toBe(true);
  });

  it("persists Employee side effects for full nav and full-operator shell", () => {
    persistDevRoleOverride("Employee");

    expect(isDevEmployeeRoleOverrideActive()).toBe(true);
    expect(readDevShellExperienceOverrideFromDocument()).toBe("full-operator");
    expect(window.localStorage.getItem(ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY)).toBe("true");
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
