import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [
  ".test.ts",
  ".test.tsx",
  ".generated.ts",
  ".generated.tsx",
] as const;

const EXCLUDED_RELATIVE_PATH_FRAGMENTS = [
  "/help-markdown/contributor-leakage/",
] as const;

/** UI roots scanned for consumer copy modules (SN-07). */
export const SECURENOW_ARCHLUCID_LEAK_SCAN_ROOTS = [
  "src/lib",
  "src/components",
  "src/app/(operator)",
  "src/app/(marketing)",
] as const;

const COPY_FILE_NAME_PATTERN = /(copy|content|topics)/i;

const ARCHLUCID_WHOLE_WORD_PATTERN = /\bArchLucid\b/;

export type SecureNowArchLucidLeakAllowlist = {
  readonly linePatterns: ReadonlyArray<{ readonly pattern: string; readonly reason: string }>;
  readonly fileExclusions: ReadonlyArray<{ readonly path: string; readonly reason: string }>;
  readonly strictPaths: readonly string[];
};

export type SecureNowArchLucidLeakViolation = {
  readonly relativePath: string;
  readonly line: number;
  readonly excerpt: string;
};

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}

function shouldExcludeFile(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);

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

function matchesCopyFileName(relativePath: string): boolean {
  const fileName = path.basename(relativePath);

  return COPY_FILE_NAME_PATTERN.test(fileName);
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

export function compileAllowlistLinePatterns(
  linePatterns: SecureNowArchLucidLeakAllowlist["linePatterns"],
): RegExp[] {
  return linePatterns.map((entry) => new RegExp(entry.pattern));
}

export function isArchLucidLineAllowlisted(
  line: string,
  compiledLinePatterns: readonly RegExp[],
): boolean {
  for (const pattern of compiledLinePatterns) {
    if (pattern.test(line)) {
      return true;
    }
  }

  return false;
}

export function scanFileForArchLucidLeaks(
  relativePath: string,
  source: string,
  compiledLinePatterns: readonly RegExp[],
): SecureNowArchLucidLeakViolation[] {
  const violations: SecureNowArchLucidLeakViolation[] = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (!ARCHLUCID_WHOLE_WORD_PATTERN.test(line)) {
      continue;
    }

    if (isArchLucidLineAllowlisted(line, compiledLinePatterns)) {
      continue;
    }

    violations.push({
      relativePath,
      line: index + 1,
      excerpt: line.trim().slice(0, 160),
    });
  }

  return violations;
}

export function buildExcludedFilePathSet(
  allowlist: SecureNowArchLucidLeakAllowlist,
): Set<string> {
  return new Set(allowlist.fileExclusions.map((entry) => normalizeRelativePath(entry.path)));
}

export function listSecureNowArchLucidLeakScanTargets(
  cwd: string = process.cwd(),
  allowlist: SecureNowArchLucidLeakAllowlist,
): string[] {
  const excludedPaths = buildExcludedFilePathSet(allowlist);
  const targets = new Set<string>();

  for (const root of SECURENOW_ARCHLUCID_LEAK_SCAN_ROOTS) {
    for (const relativePath of listFilesRecursive(cwd, root)) {
      if (!matchesCopyFileName(relativePath)) {
        continue;
      }

      if (excludedPaths.has(normalizeRelativePath(relativePath))) {
        continue;
      }

      targets.add(relativePath);
    }
  }

  for (const strictPath of allowlist.strictPaths) {
    const normalized = normalizeRelativePath(strictPath);

    if (excludedPaths.has(normalized)) {
      continue;
    }

    targets.add(normalized);
  }

  return [...targets].sort();
}

export function loadSecureNowArchLucidLeakAllowlist(
  allowlistJsonPath: string,
): SecureNowArchLucidLeakAllowlist {
  const raw = readFileSync(allowlistJsonPath, "utf8");
  const parsed = JSON.parse(raw) as SecureNowArchLucidLeakAllowlist;

  return parsed;
}

export function scanSecureNowArchLucidLeaks(
  cwd: string = process.cwd(),
  allowlist: SecureNowArchLucidLeakAllowlist,
): SecureNowArchLucidLeakViolation[] {
  const compiledLinePatterns = compileAllowlistLinePatterns(allowlist.linePatterns);
  const violations: SecureNowArchLucidLeakViolation[] = [];

  for (const relativePath of listSecureNowArchLucidLeakScanTargets(cwd, allowlist)) {
    const source = readFileSync(path.join(cwd, relativePath), "utf8");
    violations.push(...scanFileForArchLucidLeaks(relativePath, source, compiledLinePatterns));
  }

  return violations;
}

export function formatSecureNowArchLucidLeakViolations(
  violations: readonly SecureNowArchLucidLeakViolation[],
): string {
  if (violations.length === 0) {
    return "";
  }

  return violations
    .map((violation) => `${violation.relativePath}:${violation.line} ${violation.excerpt}`)
    .join("\n");
}
