import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CAREER_EXPORT_MOUNTED_UI_PATHS } from "@/lib/career-export-mounted-ui-paths";
import {
  CAREER_GRAVITY_EXPORT_MAPPER_PATH,
  CAREER_GRAVITY_EXPORT_MOUNTED_UI_SRC_PATHS,
  CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_EXPORT_WATERMARK_ROWS,
} from "@/lib/career-gravity-export-watermark-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity export watermark inventory (CG-003)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/assumed-banner/);
    expect(markdown).toMatch(/MapForExport/);
    expect(markdown).toMatch(/SimulatorRehearsalBannerOnArtifact/);
    expect(markdown).toMatch(/SIMULATOR_REHEARSAL_GUIDED_WARNING/);
    expect(markdown).toMatch(/career-export-demo-chrome/);

    for (const row of CAREER_GRAVITY_EXPORT_WATERMARK_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_EXPORT_WATERMARK_ROWS) {
      const path = join(REPO_ROOT, row.relativePath);

      expect(existsSync(path), row.relativePath).toBe(true);
    }
  });

  it("keeps mounted FC UI honesty paths listed as archlucid-ui/src rows", () => {
    expect(CAREER_GRAVITY_EXPORT_MOUNTED_UI_SRC_PATHS).toEqual(CAREER_EXPORT_MOUNTED_UI_PATHS);

    const listedUiSrc = new Set(
      CAREER_GRAVITY_EXPORT_WATERMARK_ROWS.filter((row) =>
        row.relativePath.startsWith("archlucid-ui/src/"),
      ).map((row) => row.relativePath.slice("archlucid-ui/src/".length)),
    );

    for (const relativePath of CAREER_EXPORT_MOUNTED_UI_PATHS) {
      expect(listedUiSrc.has(relativePath), `unlisted mounted UI path: ${relativePath}`).toBe(true);
    }
  });

  it("quotes the MapForExport assumed-banner gravity gap", () => {
    const mapper = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_EXPORT_MAPPER_PATH), "utf8");

    expect(mapper).toMatch(/SimulatorRehearsalBannerOnArtifact:\s*simulatorRehearsalBannerOnArtifact/);
    expect(mapper).toMatch(/IsRehearsalStructuralExecutionMode\(input\.StructuralExecutionMode\)/);

    const zipDownload = readFileSync(
      join(REPO_ROOT, "ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Download.cs"),
      "utf8",
    );

    expect(zipDownload).toMatch(/DownloadRunExport/);
    expect(zipDownload).not.toMatch(/EnsureCanExport/);
  });
});
