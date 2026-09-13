import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";
import { CHEAP_EXPLORATION_ENVELOPE_RUNNER_OWNER } from "@/lib/cheap-exploration-envelope-runner-entry";
import { DESK_IA_NO_COLLAPSE_TABS_TEST_PATH } from "@/lib/desk-ia-no-collapse-tabs-ratchet";
import { SYSTEM_GRAVITY_ACCEPTANCE_DOC_PATH } from "@/lib/system-gravity-close-audit";
import {
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/system-gravity-out-of-wave-residuals";
import { LOST_WRITE_ADR_0090_RELATIVE_PATH } from "@/lib/lost-write-adr-inventory";
import {
  SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES,
  SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR,
} from "@/lib/system-not-job-no-merge-kernels-ratchet";

const REPO_ROOT = join(process.cwd(), "..");
const UI_SRC_ROOT = join(process.cwd(), "src");
const PROMPTS_DIR = join(REPO_ROOT, ".cursor", "prompts");

const SG_111_THROUGH_118 = [
  "SG-111",
  "SG-112",
  "SG-113",
  "SG-114",
  "SG-115",
  "SG-116",
  "SG-117",
  "SG-118",
] as const;

/** ADR 0098 ratchets for SG-111–120 batch 7 skips and close. */
describe("system-gravity wave 32 batch 7 ratchets (ADR 0098)", () => {
  it("SG-111: merge-kernels skip is documented and ADR 0068 ratchet remains on disk", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-111");
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");

    expect(row?.status).toBe("not-shipped");
    expect(row?.item).toMatch(/Merge DraftRequests and Runs/i);
    expect(markdown).toContain("SG-111");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR))).toBe(true);
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.synthesis).toBe("dbo.DraftRequests");
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.review).toBe("dbo.Runs");
  });

  it("SG-112: live presence skip is recorded; ADR 0090 forbids presence invention", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-112");
    const adr0090 = readFileSync(join(REPO_ROOT, LOST_WRITE_ADR_0090_RELATIVE_PATH), "utf8");

    expect(row?.item).toMatch(/Live presence/i);
    expect(row?.status).toBe("not-shipped");
    expect(adr0090).toMatch(/without presence|not live presence/i);
  });

  it("SG-113: collapse-tabs skip is recorded; DI-009 ratchet keeps More menu empty", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-113");

    expect(row?.item).toMatch(/Collapse desktop review tabs/i);
    expect(existsSync(join(REPO_ROOT, DESK_IA_NO_COLLAPSE_TABS_TEST_PATH))).toBe(true);
  });

  it("SG-114: breadcrumbs skip is recorded; TB-2090 retirement noted in buyer back-link helper", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-114");
    const backLinkSource = readFileSync(join(UI_SRC_ROOT, "lib/buyer/buyer-polished-operate-back-link.ts"), "utf8");

    expect(row?.item).toMatch(/System-wide breadcrumbs/i);
    expect(backLinkSource).toContain("TB-2090");
    expect(backLinkSource).toMatch(/breadcrumbs removed/i);
  });

  it("SG-115: unseal skip is recorded; finalize copy states records cannot be unsealed", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-115");
    const mutationRegistry = readFileSync(join(UI_SRC_ROOT, "lib/mutation-reversibility-registry.ts"), "utf8");

    expect(row?.item).toMatch(/Unseal to edit sealed parent/i);
    expect(mutationRegistry).toMatch(/cannot be unsealed/i);
  });

  it("SG-116: CE runner remount skip is recorded; envelope runner owner stays CE-001", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-116");
    const runnerSource = readFileSync(join(UI_SRC_ROOT, "lib/cheap-exploration-envelope-runner-entry.ts"), "utf8");

    expect(row?.item).toMatch(/Remount cheap-envelope runner/i);
    expect(CHEAP_EXPLORATION_ENVELOPE_RUNNER_OWNER).toBe("CE-001");
    expect(runnerSource).toContain("CE-001");
  });

  it("SG-117: daytime wait re-implement skip is recorded; DW close audit exists", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-117");

    expect(row?.item).toMatch(/Re-implement daytime wait/i);
    expect(existsSync(join(UI_SRC_ROOT, "lib/daytime-wait-close-audit.test.ts"))).toBe(true);
    expect(existsSync(join(REPO_ROOT, "docs/architecture/DAYTIME_WAIT_ACCEPTANCE_2026-09-12.md"))).toBe(true);
  });

  it("SG-118: G-REAL-06 skip is recorded; undo window stays 300 seconds", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-118");

    expect(row?.item).toMatch(/G-REAL-06/i);
    expect(row?.status).toBe("not-shipped");
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
  });

  it("SG-119: prompt inventory ratchet covers SG-001 through SG-120", () => {
    const inventoryTest = readFileSync(join(UI_SRC_ROOT, "lib/system-gravity-prompt-inventory.test.ts"), "utf8");

    expect(inventoryTest).toContain("SG-001 through SG-120");
    expect(existsSync(join(PROMPTS_DIR, "system-gravity-00-index.md"))).toBe(true);
    expect(existsSync(join(PROMPTS_DIR, "system-gravity-111-do-not-merge-kernels.md"))).toBe(true);
    expect(existsSync(join(PROMPTS_DIR, "system-gravity-120-wave-close-audit.md"))).toBe(true);
  });

  it("SG-120: acceptance audit document exists and lists all SG-111–118 residuals", () => {
    const acceptance = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_ACCEPTANCE_DOC_PATH), "utf8");

    expect(existsSync(join(REPO_ROOT, SYSTEM_GRAVITY_ACCEPTANCE_DOC_PATH))).toBe(true);
    expect(acceptance).toMatch(/wave close audit \(SG-120\)/);

    for (const ownerPrompt of SG_111_THROUGH_118) {
      expect(acceptance).toContain(ownerPrompt);
    }
  });

  it("SG-111–118: residuals module lists every explicit skip as not-shipped", () => {
    for (const ownerPrompt of SG_111_THROUGH_118) {
      const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === ownerPrompt);

      expect(row, ownerPrompt).toBeDefined();
      expect(row?.status).toBe("not-shipped");
    }
  });
});
