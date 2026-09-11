import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY } from "@/lib/auth/livelihood-mutation-401-resume";
import { ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1 } from "@/lib/architecture/architecture-draft-offline-queue";
import {
  LOST_WRITE_401_RESUME_KIND_INVENTORY,
  LOST_WRITE_401_RESUME_YES_KIND_IDS,
} from "@/lib/lost-write-401-resume-inventory";
import { findLostWrite401ResumeAuthExclusionViolations } from "@/lib/lost-write-401-resume-auth-exclusion-guard";
import { findLostWrite401ResumeCallSiteViolations } from "@/lib/lost-write-401-resume-call-site-guard";
import { LOST_WRITE_BROWSER_WIP_KEYS } from "@/lib/lost-write-browser-wip-inventory";
import { LOST_WRITE_HELP_OVERWRITE_COPY } from "@/lib/lost-write-help-overwrite-copy-inventory";
import {
  LOST_WRITE_PATCH_DRAFT_CLIENTS,
  LOST_WRITE_PATCH_DRAFT_OMIT_COUNT_BASELINE,
  LOST_WRITE_PATCH_DRAFT_OMIT_EXCEPTION_IDS,
} from "@/lib/lost-write-patch-draft-client-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const UI_SRC = join(process.cwd(), "src");

function readRepoFile(relativePath: string): string {
  const fromUi = join(UI_SRC, relativePath);
  const fromRepo = join(REPO_ROOT, relativePath);
  const path = existsSync(fromUi) ? fromUi : fromRepo;

  expect(existsSync(path), relativePath).toBe(true);

  return readFileSync(path, "utf8");
}

describe("lost-write patch draft client inventory (LW-002)", () => {
  it("lists CLI DraftNewCommandAdmitStage and offline replay", () => {
    const ids = LOST_WRITE_PATCH_DRAFT_CLIENTS.map((row) => row.id);

    expect(ids).toContain("cli-draft-new-admit");
    expect(ids).toContain("ui-offline-replay");

    const cli = LOST_WRITE_PATCH_DRAFT_CLIENTS.find((row) => row.id === "cli-draft-new-admit");
    const replay = LOST_WRITE_PATCH_DRAFT_CLIENTS.find((row) => row.id === "ui-offline-replay");

    expect(cli?.sourceRoots.join(" ")).toMatch(/DraftNewCommandAdmitStage/);
    expect(replay?.sourceRoots.join(" ")).toMatch(/replay/i);
  });

  it("keeps omit rows at or below the shrink-only baseline", () => {
    const omitIds = LOST_WRITE_PATCH_DRAFT_CLIENTS.filter((row) => row.casPolicy === "omit").map(
      (row) => row.id,
    );
    const allowed = new Set(LOST_WRITE_PATCH_DRAFT_OMIT_EXCEPTION_IDS);

    expect(omitIds.length).toBeLessThanOrEqual(
      LOST_WRITE_PATCH_DRAFT_OMIT_COUNT_BASELINE + LOST_WRITE_PATCH_DRAFT_OMIT_EXCEPTION_IDS.length,
    );

    for (const id of omitIds) {
      expect(allowed.has(id) || LOST_WRITE_PATCH_DRAFT_OMIT_COUNT_BASELINE > 0).toBe(true);
    }
  });
});

describe("lost-write 401 resume inventory (LW-003 / LW-054–062)", () => {
  it("keeps all livelihood pending mutation kinds wrapped for 401 resume", () => {
    const byId = new Map(LOST_WRITE_401_RESUME_KIND_INVENTORY.map((row) => [row.id, row]));

    expect(LOST_WRITE_401_RESUME_KIND_INVENTORY.length).toBe(LOST_WRITE_401_RESUME_YES_KIND_IDS.length);

    for (const id of LOST_WRITE_401_RESUME_YES_KIND_IDS) {
      expect(byId.get(id)?.resumeWrapperPresent).toBe("yes");
    }

    for (const row of LOST_WRITE_401_RESUME_KIND_INVENTORY) {
      expect(row.resumeWrapperPresent).toBe("yes");
    }
  });

  it("keeps yes-row wrappers in source", () => {
    const disposition = readRepoFile("lib/api/governance-stickiness-api-dispositions.ts");
    const correction = readRepoFile("lib/governance/governance-mutation-correction-api.ts");
    const resumeCore = readRepoFile("lib/auth/livelihood-mutation-401-resume.ts");
    const wrappers = readRepoFile("lib/auth/livelihood-mutation-401-resume-wrappers.ts");

    expect(disposition).toContain("recordFindingDispositionWith401Resume");
    expect(correction).toContain("recordGovernanceMutationCorrectionWith401Resume");
    expect(disposition).toContain("withLivelihood401Resume");
    expect(correction).toContain("withLivelihood401Resume");
    expect(resumeCore).toContain("export async function withLivelihood401Resume");
    expect(wrappers).toContain("patchDraftRequestWith401Resume");
    expect(wrappers).toContain("saveItsmConnectorWith401Resume");
  });
});

describe("lost-write 401 resume ratchets (LW-069 / LW-070)", () => {
  it("keeps inventoried mutate sites wrapped and auth routes excluded", () => {
    const uiRoot = process.cwd();
    const callSiteViolations = findLostWrite401ResumeCallSiteViolations(uiRoot);
    const authExclusionViolations = findLostWrite401ResumeAuthExclusionViolations(uiRoot);

    expect(callSiteViolations).toEqual([]);
    expect(authExclusionViolations).toEqual([]);
  });
});

describe("lost-write browser WIP keys (LW-005)", () => {
  it("records pending mutation v2 as localStorage and v1 offline queue as localStorage without expectedUtc", () => {
    const pendingV1 = LOST_WRITE_BROWSER_WIP_KEYS.find((row) => row.id === "pending-mutation-v1");
    const pendingV2 = LOST_WRITE_BROWSER_WIP_KEYS.find((row) => row.id === "pending-mutation-v2");
    const queueV1 = LOST_WRITE_BROWSER_WIP_KEYS.find((row) => row.id === "offline-draft-queue-v1");

    expect(pendingV1?.storage).toBe("sessionStorage");
    expect(pendingV1?.survivesTabClose).toBe(false);

    expect(pendingV2?.storage).toBe("localStorage");
    expect(pendingV2?.survivesTabClose).toBe(true);
    expect(pendingV2?.crossDevice).toBe(false);
    expect(pendingV2?.key).toBe(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY);

    expect(queueV1?.storage).toBe("localStorage");
    expect(queueV1?.key).toBe(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1);
    expect(queueV1?.notes).toMatch(/no expectedUpdatedUtc/);
  });

  it("does not claim server-side user preferences for WIP keys", () => {
    for (const row of LOST_WRITE_BROWSER_WIP_KEYS) {
      expect(row.crossDevice).toBe(false);
      expect(row.notes.toLowerCase()).not.toMatch(/server-side user preference/);
    }
  });
});

describe("lost-write offline queue CAS contract (LW-006)", () => {
  it("exists and forbids omit-token replay", () => {
    const contract = readFileSync(
      join(REPO_ROOT, "docs/architecture/LOST_WRITE_OFFLINE_QUEUE_CAS.md"),
      "utf8",
    );

    expect(contract).toMatch(/expectedUpdatedUtc/);
    expect(contract).toMatch(/must not dequeue/);
    expect(contract).toMatch(/Never.*omit-token PATCH/i);
    expect(contract).toMatch(/409/);
  });
});

describe("lost-write CAS compat matrix (LW-009 / LW-010)", () => {
  it("pins omit-token to 409 with distinct codes", () => {
    const compat = readFileSync(join(REPO_ROOT, "docs/architecture/LOST_WRITE_CAS_COMPAT.md"), "utf8");
    const breaking = readFileSync(join(REPO_ROOT, "BREAKING_CHANGES.md"), "utf8");

    expect(compat).toMatch(/draft_cas_token_missing/);
    expect(compat).toMatch(/draft_cas_stale/);
    expect(compat).toMatch(/409/);
    expect(breaking).toMatch(/2026-09-10/);
    expect(breaking).toMatch(/draft_cas_token_missing/);

    const startReview = readFileSync(
      join(REPO_ROOT, "docs/architecture/LOST_WRITE_START_REVIEW_VS_PATCH_CAS.md"),
      "utf8",
    );
    expect(startReview).toMatch(/DraftPatchStaleUpdatedUtcGuard/);
    expect(startReview).toMatch(/DraftStartReviewStaleUpdatedUtcGuard/);
    expect(startReview).toMatch(/Do not merge/i);
  });

  it("snapshots generated PatchDraftRequest fields as JSON-optional", () => {
    const schemas = readFileSync(join(process.cwd(), "src/lib/api-types/schemas.generated.ts"), "utf8");
    const patchBlock = schemas.slice(
      schemas.indexOf("PatchDraftRequest:"),
      schemas.indexOf("PatchDraftRequest:") + 1200,
    );

    expect(patchBlock).toMatch(/expectedUpdatedUtc\?:/);
    expect(patchBlock).toMatch(/forceOverwrite\?:/);
  });

  it("documents fail-closed CAS on the OpenAPI PatchDraftRequest snapshot (LW-024)", () => {
    const snapshot = readFileSync(
      join(REPO_ROOT, "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json"),
      "utf8",
    );
    const patchBlock = snapshot.slice(
      snapshot.indexOf('"PatchDraftRequest"'),
      snapshot.indexOf('"PatchDraftRequest"') + 2500,
    );

    expect(patchBlock).toMatch(/draft_cas_token_missing/);
    expect(patchBlock).toMatch(/Never defaults to true/);
    expect(patchBlock).toMatch(/required-unless-forceOverwrite/);
  });
});

describe("lost-write prompt file ratchet (LW-099)", () => {
  it("documents the LW-00 index and numbered prompt inventory test", () => {
    const inventoryTest = readRepoFile("lib/lost-write-prompt-inventory.test.ts");

    expect(inventoryTest).toMatch(/lost-write-00-index\.md/);
    expect(inventoryTest).toMatch(/lost-write-\\d\{3\}-/);
    expect(inventoryTest).toMatch(/toHaveLength\(100\)/);
  });
});

describe("lost-write TB-2155 recovery roots (LW-098)", () => {
  it("documents offline replay conflict and livelihood resume failure surfaces", () => {
    const inventory = readRepoFile("lib/error-recovery-contract-inventory.ts");

    expect(inventory).toMatch(/architecture-draft-offline-replay-conflict/);
    expect(inventory).toMatch(/livelihood-mutation-resume-failed/);
    expect(inventory).toMatch(/ArchitectureDraftWorkspaceIntakeStack/);
    expect(inventory).toMatch(/LivelihoodMutationResumeChrome/);
  });
});

describe("lost-write mutation error toast inventory (LW-097)", () => {
  it("documents sticky mutation error toast guard module", () => {
    const guard = readRepoFile("lib/lost-write-mutation-error-toast-guard.ts");
    const inventory = readRepoFile("lib/lost-write-mutation-error-toast-inventory.ts");
    const toastHelpers = readRepoFile("lib/toast.ts");

    expect(inventory).toMatch(/showMutationError/);
    expect(guard).toMatch(/findLostWriteMutationErrorToastViolations/);
    expect(toastHelpers).toMatch(/TOAST_STICKY_DURATION/);
  });
});

describe("lost-write help overwrite copy (LW-012)", () => {
  it("inventories Keep mine without live-presence language", () => {
    const ids = LOST_WRITE_HELP_OVERWRITE_COPY.map((row) => row.id);

    expect(ids).toContain("draft-conflict-keep-mine");

    for (const row of LOST_WRITE_HELP_OVERWRITE_COPY) {
      expect(row.honesty).not.toBe("presence-risk");
      expect(row.excerpt.toLowerCase()).not.toMatch(/live presence/);
      expect(row.excerpt.toLowerCase()).not.toMatch(/real-time collab/);
    }
  });
});
