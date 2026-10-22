import { describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";
import {
  getTenantReviewCycleBaselineHours,
  saveTenantReviewCycleBaseline,
  validateMandatoryWizardBaselineReviewCycleHours,
  validateWizardBaselineReviewCycleHours,
} from "@/lib/save-tenant-review-cycle-baseline";

describe("validateMandatoryWizardBaselineReviewCycleHours", () => {
  it("allows empty input for tenant-already-captured follow-up", () => {
    expect(validateMandatoryWizardBaselineReviewCycleHours("")).toBeNull();
  });

  it("delegates non-empty values to standard validation", () => {
    expect(validateMandatoryWizardBaselineReviewCycleHours("40")).toBeNull();
    expect(validateMandatoryWizardBaselineReviewCycleHours("-1")).toBe(
      "Review cycle time must be between 0 and 10,000 (exclusive of zero).",
    );
  });
});

describe("validateWizardBaselineReviewCycleHours", () => {
  it("still allows blank optional validation in settings-style flows", () => {
    expect(validateWizardBaselineReviewCycleHours("")).toBeNull();
  });
});

describe("getTenantReviewCycleBaselineHours", () => {
  it("forwards operator scope headers on GET", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ baselineReviewCycleHours: 32 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTenantReviewCycleBaselineHours()).resolves.toBe(32);

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("returns null when baseline is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ baselineReviewCycleHours: null }),
      })),
    );

    await expect(getTenantReviewCycleBaselineHours()).resolves.toBeNull();

    vi.unstubAllGlobals();
  });

  it("returns positive hours when baseline exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ baselineReviewCycleHours: 32 }),
      })),
    );

    await expect(getTenantReviewCycleBaselineHours()).resolves.toBe(32);

    vi.unstubAllGlobals();
  });
});

describe("saveTenantReviewCycleBaseline", () => {
  it("forwards operator scope headers on PUT", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveTenantReviewCycleBaseline({
      baselineReviewCycleHours: 40,
      baselineReviewCycleSourceNote: "wizard:confident",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });
});
