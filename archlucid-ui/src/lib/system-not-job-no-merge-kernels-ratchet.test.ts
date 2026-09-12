import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  isSystemNotJobHonestCompareApiQueryParam,
  SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS,
  SYSTEM_NOT_JOB_FORBIDDEN_COMPARE_DRAFT_PARAMS,
  SYSTEM_NOT_JOB_KERNEL_REPOSITORY_INTERFACES,
  SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES,
  SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE,
  SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR,
  SYSTEM_NOT_JOB_NO_MERGE_KERNELS_OWNER,
} from "@/lib/system-not-job-no-merge-kernels-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-034 no-merge-kernels ratchet", () => {
  it("declares explicit acceptance line for close audit (ADR 0068)", () => {
    expect(SYSTEM_NOT_JOB_NO_MERGE_KERNELS_OWNER).toBe("SN-034");
    expect(SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE).toContain("ADR 0068");
    expect(SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE).toContain("two SQL tables");
    expect(SYSTEM_NOT_JOB_NO_MERGE_KERNELS_ACCEPTANCE_LINE).toContain("leftRunId/rightRunId");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR))).toBe(true);
  });

  it("ADR 0068 still declares two kernels with separate DraftRequests persistence", () => {
    const adr = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_NO_MERGE_KERNELS_DOC_ANCHOR), "utf8");

    expect(adr).toMatch(/two kernels/i);
    expect(adr).toMatch(/Option K/);
    expect(adr).toMatch(/DraftRequests/);
    expect(adr).toMatch(/IArchitectureSynthesisKernel/);
    expect(adr).toMatch(/AuthorityPipelineStagesExecutor/);
    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);
  });

  it("master SQL DDL keeps DraftRequests and Runs as separate tables", () => {
    const sql = readFileSync(
      join(REPO_ROOT, "ArchLucid.Persistence/Scripts/ArchLucid.sql"),
      "utf8",
    );

    expect(sql).toMatch(/CREATE TABLE\s+dbo\.DraftRequests\b/i);
    expect(sql).toMatch(/CREATE TABLE\s+dbo\.Runs\b/i);
    expect(sql).not.toMatch(/CREATE TABLE\s+dbo\.(DraftRun|UnifiedDraftRun|MergedKernel)\b/i);
  });

  it("persistence uses separate repository ports — no unified write entity", () => {
    const draftRepo = readFileSync(
      join(
        REPO_ROOT,
        "ArchLucid.Core/Persistence/ApplicationPorts/Interfaces/IDraftRequestRepository.cs",
      ),
      "utf8",
    );
    const runRepo = readFileSync(
      join(REPO_ROOT, "ArchLucid.Core/Persistence/ApplicationPorts/Interfaces/IRunRepository.cs"),
      "utf8",
    );
    const dapperDraft = readFileSync(
      join(
        REPO_ROOT,
        "ArchLucid.Persistence/Data/Repositories/DapperDraftRequestRepository.cs",
      ),
      "utf8",
    );
    const sqlRun = readFileSync(
      join(REPO_ROOT, "ArchLucid.Persistence/Repositories/RunRecordParameters.cs"),
      "utf8",
    );

    expect(draftRepo).toContain("interface IDraftRequestRepository");
    expect(runRepo).toContain("interface IRunRepository");
    expect(dapperDraft).toContain(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.synthesis);
    expect(sqlRun).toContain(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.review);
    expect(draftRepo).not.toContain("IRunRepository");
    expect(runRepo).not.toContain("IDraftRequestRepository");
  });

  it("does not introduce ORM entities that unify DraftRequests and Runs writes", () => {
    const scanRoots = [
      join(REPO_ROOT, "ArchLucid.Persistence"),
      join(REPO_ROOT, "ArchLucid.Core"),
    ];
    const forbiddenPatterns = [
      /\bDbSet\b/,
      /\bEntityFramework\b/,
      /\bUnifiedDraftRun\b/,
      /\bMergedKernel\b/,
      /\bIDraftRunRepository\b/,
    ];

    function collectCsFiles(root: string): string[] {
      const files: string[] = [];

      for (const entry of readdirSync(root)) {
        const fullPath = join(root, entry);

        if (statSync(fullPath).isDirectory()) {
          files.push(...collectCsFiles(fullPath));
          continue;
        }

        if (entry.endsWith(".cs")) {
          files.push(fullPath);
        }
      }

      return files;
    }

    for (const root of scanRoots) {
      for (const filePath of collectCsFiles(root)) {
        const source = readFileSync(filePath, "utf8");

        for (const pattern of forbiddenPatterns) {
          expect(source, filePath).not.toMatch(pattern);
        }
      }
    }
  });

  it("compare API modules use run id query params only", () => {
    const compareApi = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/api/architecture-runs-compare.ts"),
      "utf8",
    );
    const compareService = readFileSync(
      join(
        REPO_ROOT,
        "ArchLucid.Persistence/Coordination/Compare/AuthorityCompareService.cs",
      ),
      "utf8",
    );

    expect(compareApi).toContain(SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.left);
    expect(compareApi).toContain(SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.right);

    for (const forbidden of SYSTEM_NOT_JOB_FORBIDDEN_COMPARE_DRAFT_PARAMS) {
      expect(compareApi).not.toContain(forbidden);
    }

    expect(compareService).toContain("CompareRunsAsync");
    expect(compareService).toContain("leftRunId");
    expect(compareService).toContain("rightRunId");
    expect(compareService).not.toContain("DraftRequest");
  });

  it("honest compare query param guard accepts run ids only", () => {
    expect(isSystemNotJobHonestCompareApiQueryParam("leftRunId")).toBe(true);
    expect(isSystemNotJobHonestCompareApiQueryParam("rightRunId")).toBe(true);
    expect(isSystemNotJobHonestCompareApiQueryParam("draftId")).toBe(false);
    expect(isSystemNotJobHonestCompareApiQueryParam("leftDraftId")).toBe(false);
  });

  it("names separate kernel repository interfaces in ratchet inventory", () => {
    expect(SYSTEM_NOT_JOB_KERNEL_REPOSITORY_INTERFACES.synthesis).toBe("IDraftRequestRepository");
    expect(SYSTEM_NOT_JOB_KERNEL_REPOSITORY_INTERFACES.review).toBe("IRunRepository");
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.synthesis).toBe("dbo.DraftRequests");
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.review).toBe("dbo.Runs");
  });
});
