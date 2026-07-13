/**
 * Build-time: renders pdfStatus-eligible product docs to static PDFs via ArchLucid.Cli (TB-723).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  listProductDocumentationEntries,
  type ProductDocumentationAudience,
  type ProductDocumentationPdfStatus,
} from "../src/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "../src/lib/load-product-documentation";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_ROOT = join(__dirname, "..");
const REPO_ROOT = join(UI_ROOT, "..");
const CLI_PROJECT = join(REPO_ROOT, "ArchLucid.Cli", "ArchLucid.Cli.csproj");
const WORK_DIR = join(UI_ROOT, ".build", "docs-pdf-work");
const PUBLIC_OUT_DIR = join(UI_ROOT, "public", "docs-pdf");
const CUSTOMER_OUT_DIR = join(UI_ROOT, ".build", "docs-pdf-customer");

type ManifestEntry = {
  slug: string;
  sourceSha256: string;
  generatedAt: string;
};

function audienceLabel(audience: ProductDocumentationAudience): string {
  switch (audience) {
    case "buyer":
      return "Buyer / sponsor";
    case "operator":
      return "Workspace operator";
    case "marketing":
      return "Marketing";
    case "developer":
      return "Technical administrator";
    default: {
      const exhaustive: never = audience;

      return exhaustive;
    }
  }
}

function statusLabel(pdfStatus: ProductDocumentationPdfStatus): string {
  switch (pdfStatus) {
    case "public":
      return "Public";
    case "customer":
      return "Customer";
    case "internal":
      return "Internal";
    default: {
      const exhaustive: never = pdfStatus;

      return exhaustive;
    }
  }
}

const LOGO_PNG = join(REPO_ROOT, "archlucid-ui", "public", "logo", "archlucid-dark.png");

function ensureBrandLogoRaster(): void {
  if (existsSync(LOGO_PNG)) {
    return;
  }

  execFileSync("npm", ["run", "generate:brand-raster"], { cwd: UI_ROOT, stdio: "inherit" });
}

function resolveVersionDateLabel(sourcePaths: readonly string[]): string | null {
  const primary = sourcePaths[0];

  if (primary === undefined) {
    return null;
  }

  try {
    const relative = primary.replace(/\\/g, "/");
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relative],
      { cwd: REPO_ROOT, encoding: "utf8" },
    ).trim();

    return output.length > 0 ? output : null;
  } catch {
    return null;
  }
}

function renderPdf(markdownPath: string, metadataPath: string, outputPath: string): void {
  execFileSync(
    "dotnet",
    [
      "run",
      "--project",
      CLI_PROJECT,
      "-c",
      "Release",
      "--",
      "docs",
      "pdf",
      "render",
      "--markdown",
      markdownPath,
      "--metadata",
      metadataPath,
      "--out",
      outputPath,
    ],
    { cwd: REPO_ROOT, stdio: "inherit" },
  );
}

function main(): void {
  ensureBrandLogoRaster();
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });
  mkdirSync(PUBLIC_OUT_DIR, { recursive: true });
  mkdirSync(CUSTOMER_OUT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const manifest: ManifestEntry[] = [];

  for (const entry of listProductDocumentationEntries()) {
    if (entry.pdfStatus === null || entry.pdfStatus === "internal") {
      continue;
    }

    const loaded = tryLoadProductDocumentation(entry.slug);

    if (loaded === null) {
      throw new Error(`Unable to load markdown for PDF-eligible slug "${entry.slug}".`);
    }

    const sourceSha256 = createHash("sha256").update(loaded.markdown, "utf8").digest("hex");
    const markdownPath = join(WORK_DIR, `${entry.slug}.md`);
    const metadataPath = join(WORK_DIR, `${entry.slug}.metadata.json`);
    const outputPath =
      entry.pdfStatus === "public"
        ? join(PUBLIC_OUT_DIR, `${entry.slug}.pdf`)
        : join(CUSTOMER_OUT_DIR, `${entry.slug}.pdf`);

    writeFileSync(markdownPath, loaded.markdown, "utf8");
    writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          title: entry.title,
          versionDateLabel: resolveVersionDateLabel(entry.sourcePaths),
          audienceLabel: audienceLabel(entry.audience),
          statusLabel: statusLabel(entry.pdfStatus),
          logoPath: LOGO_PNG,
        },
        null,
        2,
      ),
      "utf8",
    );

    renderPdf(markdownPath, metadataPath, outputPath);

    if (entry.pdfStatus === "public") {
      manifest.push({
        slug: entry.slug,
        sourceSha256,
        generatedAt,
      });
    }
  }

  const manifestPath = join(PUBLIC_OUT_DIR, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${manifest.length} public PDF(s) to ${PUBLIC_OUT_DIR} and manifest.json (${generatedAt}).`,
  );
}

main();
