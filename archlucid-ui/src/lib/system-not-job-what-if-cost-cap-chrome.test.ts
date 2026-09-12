import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  isDraftBranchWhatIfOverCap,
  resolveDraftBranchWhatIfCostCapChrome,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED,
} from "@/lib/system-not-job-what-if-cost-cap-chrome";

const repoRoot = join(__dirname, "..", "..", "..");

const underCapQuota = {
  draftId: "draft-1",
  existingBranchCount: 1,
  maxBranchesPerParent: 3,
  remainingBranches: 2,
  canBranch: true,
  estimatedBranchRunCostUsd: 4.5,
};

const overCapQuota = {
  draftId: "draft-1",
  existingBranchCount: 3,
  maxBranchesPerParent: 3,
  remainingBranches: 0,
  canBranch: false,
  estimatedBranchRunCostUsd: 4.5,
};

describe("SN-009 what-if cost cap chrome", () => {
  it("disables confirm while branch quota is loading (TB-2005)", () => {
    const chrome = resolveDraftBranchWhatIfCostCapChrome({
      quota: null,
      quotaLoading: true,
      quotaFailed: false,
    });

    expect(chrome.confirmDisabled).toBe(true);
    expect(chrome.capSummary).toBeNull();
  });

  it("shows cap summary and allows confirm when under cap", () => {
    const chrome = resolveDraftBranchWhatIfCostCapChrome({
      quota: underCapQuota,
      quotaLoading: false,
      quotaFailed: false,
    });

    expect(chrome.confirmDisabled).toBe(false);
    expect(chrome.allowsFullPipelineWhatIf).toBe(true);
    expect(chrome.capSummary).toContain("1/3");
    expect(chrome.overCapBlockedReason).toBeNull();
    expect(chrome.notBudgetPillHonesty).toBe(SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL);
    expect(chrome.notBudgetPillHonesty.toLowerCase()).toContain("not the shell ai budget pill");
    expect(chrome.notBudgetPillHonesty.toLowerCase()).not.toContain("career door");
  });

  it("blocks confirm with honesty when over cap (TB-2005)", () => {
    expect(isDraftBranchWhatIfOverCap(overCapQuota)).toBe(true);

    const chrome = resolveDraftBranchWhatIfCostCapChrome({
      quota: overCapQuota,
      quotaLoading: false,
      quotaFailed: false,
    });

    expect(chrome.confirmDisabled).toBe(true);
    expect(chrome.allowsFullPipelineWhatIf).toBe(false);
    expect(chrome.overCapBlockedReason).toBe(SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED);
  });

  it("does not reference the LLM budget pill module", () => {
    const moduleSource = readFileSync(
      join(repoRoot, "archlucid-ui", "src", "lib", "system-not-job-what-if-cost-cap-chrome.ts"),
      "utf8",
    );

    expect(moduleSource).not.toContain("llm-budget-status-pill");
    expect(moduleSource).toContain("branch-quota");
  });

  it("points at ADR 0092 for cheap envelope cost-cap follow-up", () => {
    const adr = readFileSync(
      join(repoRoot, "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md"),
      "utf8",
    );

    expect(adr).toContain("SN-009");
  });
});
