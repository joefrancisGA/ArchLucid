import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  REVIEW_TERMINOLOGY_BANNED_MANIFEST_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_PACKAGE_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS,
  REVIEW_TERMINOLOGY_BANNED_PRODUCT_VERSION_PATTERNS,
  REVIEW_TERMINOLOGY_GOLDEN_PATH_BANNED_PATTERNS,
} from "@/lib/review-terminology-surfaces";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [
  ".test.ts",
  ".test.tsx",
  ".generated.ts",
  ".generated.tsx",
] as const;

const EXCLUDED_RELATIVE_PATH_FRAGMENTS = [
  "/api-types.generated.ts",
  "/help-index.generated.ts",
  "/packages/api-types/",
  "/review-terminology-surfaces.ts",
  "/review-terminology-scanner.ts",
  "/review-terminology-copy.ts",
  "/internal-concept-leakage-surfaces.ts",
  "/pipeline-status-label-surfaces.ts",
  "/retired-demo-org-branding.ts",
  "/help-product-language.ts",
  // Leakage strippers hold the banned phrasing as search patterns, not as shipped copy.
  "/help-markdown/contributor-leakage/",
  "/help-markdown/markdown-cleanup.ts",
  // Route-inventory workbook notes mirrored from docs/architecture/ui_route_traffic_estimates.template.md.
  "/ui-route-traffic",
  // Surface inventory whose `notes` describe engineering intent for a Vitest guard; never rendered.
  "/operator/operator-line-tabs-surfaces.ts",
  "/itsm-connectors-admin-scope.ts",
  "/api-v1-routes.ts",
  "/wizard-evidence-source-options.ts",
  "/golden-path-glossary-nouns.ts",
  "/lib/api/",
  "/committed-run-picker.ts",
  "/operator-run-picker-client.ts",
  "/draft-branch-compare-navigation.ts",
  // Banned-pattern registry for first-review help — literals are search patterns, not shipped copy.
  "/first-architecture-review-help-banned-copy.ts",
] as const;

/** Buyer-facing UI roots scanned by the global terminology guard (TB-355). */
export const REVIEW_TERMINOLOGY_GLOBAL_SCAN_ROOTS = [
  "src/app/(operator)",
  "src/app/(marketing)",
  "src/components",
  "src/lib",
] as const;

const LINE_SAFELIST_PATTERNS = [
  /\brunid\b/i,
  /\brun-id\b/i,
  /\brun_id\b/i,
  /\/architecture\/reviews\//i,
  /\/v1\//i,
  /openapi\/v\d/i,
  /\.v\d+["'`;,)]/i,
  /_V1\b/,
  /_v1\b/,
  /REPORT_PROBLEM_V1/i,
  /DEFAULT_POLICY_PACKS_V1/i,
  /POLICY_PACK.*_V1/i,
  /availability === "v1\.1"/i,
  /placeholder="e\.g\. v1\.0\.0"/i,
  /\bsetV1\b/,
  /thresholdValue: v1/,
  /value=\{v1\}/,
  /data-testid/i,
  /^import\s+/,
  /^export\s+/,
  /from\s+["']/,
  /className=/,
  /^\s*\/\//,
  /^\s*\*/,
  /@\/components\/Run/i,
  /@\/lib\/.*run/i,
  /RunDetail/i,
  /RunTable/i,
  /RunProgress/i,
  /RunAgent/i,
  /RunEstimated/i,
  /RunExplanation/i,
  /RunSavings/i,
  /RunRetrieval/i,
  /CommitRun/i,
  /EmailRun/i,
  /RunsList/i,
  /RunsDashboard/i,
  /QuickReview/i,
  /QuickStart/i,
  /operator-static-demo/i,
  /SHOWCASE_STATIC_DEMO_RUN_ID/i,
  /sandbox-api-mocks/i,
  /architecture-runs\.ts/i,
  /manifest\.json/i,
  /manifestId/i,
  /manifestVersion/i,
  /manifestHash/i,
  /manifestDiff/i,
  /manifestComparison/i,
  /goldenManifest/i,
  /GoldenManifest/i,
  /\/(?:manifests|(?:governance\/)?signed-records)\//i,
  /\/manifest["'`]/i,
  /manifest-summary/i,
  /manifest-detail/i,
  /manifest-review/i,
  /manifest-key/i,
  /manifest-buyer/i,
  /manifest-json/i,
  /manifest\.webmanifest/i,
  /commit-manifest/i,
  /compare-raw-manifest/i,
  /manifestCommittedUtc/i,
  /totalManifestsCreated/i,
  /averageTimeToManifest/i,
  /hasGoldenManifest/i,
  /hasManifest/i,
  /ManifestDetail/i,
  /ManifestJson/i,
  /ManifestTop/i,
  /ManifestBuyer/i,
  /ManifestDeliverable/i,
  /ManifestCompare/i,
  /ManifestBundle/i,
  /ManifestDocument/i,
  /ManifestSummary/i,
  /ManifestComparison/i,
  /manifest_/i,
  /manifest-/i,
  /#manifest/i,
  /governed-manifest/i,
  /golden-manifest/i,
  /BUYER_.*MANIFEST/i,
  /SIGNED_MANIFEST/i,
  /SHOWCASE.*MANIFEST/i,
  /FIXTURE.*MANIFEST/i,
  /SCREENSHOT.*MANIFEST/i,
  /MANIFEST_DETAIL/i,
  /MANIFEST_ID/i,
  /manifestishEvent/i,
  /type:\s*"packaged"/i,
  /packaged demo/i,
  /Former terms?:/i,
  /deprecatedAliases/i,
  /^\s*term:\s*"/,
  /ReviewPackage/i,
  /review-package/i,
  /packageOrigin/i,
  /AzureExtractorPackage/i,
  /WizardStepBaselineZip/i,
  /policy pack/i,
  /policy-pack/i,
  /PolicyPack/i,
  /npm package/i,
  /node_modules/i,
  /BUYER_.*PACKAGE/i,
  /EXAMPLE_PACKAGE/i,
  /SAMPLE_PACKAGE/i,
  /PACKAGE_HEADING/i,
  /PACKAGE_SHORTCUTS/i,
  /PACKAGE_VALIDATION/i,
  /PACKAGE_PRIMARY/i,
  /PACKAGE_SECTION/i,
  /PACKAGE_SUMMARY/i,
  /PACKAGE_PLAIN/i,
  /PACKAGE_EVIDENCE/i,
  /PACKAGE_INCLUDES/i,
  /ReviewsHubRecentPackages/i,
  /ReplaySelectedPackage/i,
  /ReviewPackageValidation/i,
  /Review Package\$/i,
] as const;

const ALL_BANNED_PATTERNS = [
  ...REVIEW_TERMINOLOGY_BANNED_PRIMARY_RUN_PATTERNS,
  ...REVIEW_TERMINOLOGY_BANNED_MANIFEST_PATTERNS,
  ...REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS,
  ...REVIEW_TERMINOLOGY_BANNED_PACKAGE_PATTERNS,
  ...REVIEW_TERMINOLOGY_BANNED_PRODUCT_VERSION_PATTERNS,
] as const;

export type ReviewTerminologyViolation = {
  readonly relativePath: string;
  readonly line: number;
  readonly pattern: string;
  readonly excerpt: string;
};

function shouldExcludeFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  for (const suffix of EXCLUDED_FILE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      return true;
    }
  }

  for (const fragment of EXCLUDED_RELATIVE_PATH_FRAGMENTS) {
    if (normalized.includes(fragment)) {
      return true;
    }
  }

  return false;
}

function listFilesRecursive(rootDir: string, relativeRoot: string): string[] {
  const absoluteRoot = path.join(rootDir, relativeRoot);
  const files: string[] = [];

  for (const entry of readdirSync(absoluteRoot)) {
    const absolutePath = path.join(absoluteRoot, entry);
    const relativePath = path.join(relativeRoot, entry).replace(/\\/g, "/");
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(rootDir, relativePath));
      continue;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(relativePath))) {
      continue;
    }

    if (shouldExcludeFile(relativePath)) {
      continue;
    }

    files.push(relativePath);
  }

  return files.sort();
}

export function listGlobalBuyerSurfaceFiles(cwd: string = process.cwd()): string[] {
  const files = new Set<string>();

  for (const root of REVIEW_TERMINOLOGY_GLOBAL_SCAN_ROOTS) {
    for (const relativePath of listFilesRecursive(cwd, root)) {
      files.add(relativePath);
    }
  }

  return [...files].sort();
}

function patternMatchesLine(line: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");

  return regex.test(line);
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("*/")
  );
}

function isSafelistedLine(line: string): boolean {
  for (const pattern of LINE_SAFELIST_PATTERNS) {
    if (pattern.test(line)) {
      return true;
    }
  }

  return false;
}

export function scanBuyerFacingTerminology(
  relativePath: string,
  source: string,
): ReviewTerminologyViolation[] {
  const violations: ReviewTerminologyViolation[] = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (isCommentLine(line) || isSafelistedLine(line)) {
      continue;
    }

    for (const pattern of ALL_BANNED_PATTERNS) {
      if (!patternMatchesLine(line, pattern)) {
        continue;
      }

      violations.push({
        relativePath,
        line: index + 1,
        pattern,
        excerpt: line.trim().slice(0, 160),
      });
    }
  }

  return violations;
}

export function scanGoldenPathBuyerCopy(
  relativePath: string,
  source: string,
): ReviewTerminologyViolation[] {
  const violations: ReviewTerminologyViolation[] = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (isCommentLine(line) || isSafelistedLine(line)) {
      continue;
    }

    for (const pattern of REVIEW_TERMINOLOGY_GOLDEN_PATH_BANNED_PATTERNS) {
      if (!patternMatchesLine(line, pattern)) {
        continue;
      }

      violations.push({
        relativePath,
        line: index + 1,
        pattern,
        excerpt: line.trim().slice(0, 160),
      });
    }
  }

  return violations;
}

export function scanGlobalBuyerSurfaces(cwd: string = process.cwd()): ReviewTerminologyViolation[] {
  const violations: ReviewTerminologyViolation[] = [];

  for (const relativePath of listGlobalBuyerSurfaceFiles(cwd)) {
    const source = readFileSync(path.join(cwd, relativePath), "utf8");
    violations.push(...scanBuyerFacingTerminology(relativePath, source));
  }

  return violations;
}
