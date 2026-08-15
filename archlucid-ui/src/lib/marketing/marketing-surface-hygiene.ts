import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Marketing route group + dedicated marketing components scanned by TB-736. */
export const MARKETING_SURFACE_SCAN_RELATIVE_ROOTS: readonly string[] = [
  "archlucid-ui/src/app/(marketing)",
  "archlucid-ui/src/components/marketing",
] as const;

export const MARKETING_SURFACE_BANNED_LINK_TARGET_PATTERNS: readonly RegExp[] = [
  /\/why-archlucid(?!-)/,
  /\/demo\/explain/,
] as const;

export const MARKETING_SURFACE_BANNED_INTERNAL_ROUTE_PREFIXES: readonly string[] = [
  "/internal/",
  "/governance/",
  "/administration/",
  "/operate/",
] as const;

/** Capitalized persona label — buyers use Architect/Sponsor/Admin per CONCEPT_VOCABULARY.md#ui-glossary-v1. */
export const MARKETING_SURFACE_BANNED_PERSONA_PATTERN = /\bOperator\b/g;

export const MARKETING_SURFACE_BANNED_BACKLOG_LABEL_PATTERN = /\bTB-\d{3}\b/;

const SCANNED_EXTENSIONS = new Set<string>([".ts", ".tsx"]);

export type MarketingSurfaceHygieneViolation = {
  readonly file: string;
  readonly pattern: string;
  readonly excerpt: string;
};

function listSourceFiles(repoRoot: string, relativeRoot: string): string[] {
  const absoluteRoot = join(repoRoot, relativeRoot);
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const extension = entry.slice(entry.lastIndexOf("."));

      if (!SCANNED_EXTENSIONS.has(extension)) {
        continue;
      }

      if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) {
        continue;
      }

      files.push(relative(repoRoot, absolutePath).replaceAll("\\", "/"));
    }
  }

  walk(absoluteRoot);

  return files.sort();
}

function stripBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripLineComments(source: string): string {
  return source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function scanSourceForPattern(
  source: string,
  pattern: RegExp | string,
  file: string,
  violations: MarketingSurfaceHygieneViolation[],
): void {
  const haystack = stripLineComments(stripBlockComments(source));
  const regex = typeof pattern === "string" ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : pattern;

  const match = regex.exec(haystack);

  if (match === null) {
    return;
  }

  violations.push({
    file,
    pattern: typeof pattern === "string" ? pattern : pattern.source,
    excerpt: match[0],
  });
}

function isAllowedOperatorPersonaReference(haystack: string, matchIndex: number): boolean {
  const window = haystack.slice(Math.max(0, matchIndex - 48), matchIndex + 48);

  return (
    window.includes("@/")
    || window.includes("(operator)")
    || window.includes("operator-")
    || window.includes("operator.")
    || window.includes("operatorSummary")
  );
}

function scanOperatorPersonaViolations(
  source: string,
  file: string,
  violations: MarketingSurfaceHygieneViolation[],
): void {
  const haystack = stripLineComments(stripBlockComments(source));
  const regex = new RegExp(MARKETING_SURFACE_BANNED_PERSONA_PATTERN.source, "g");
  let match: RegExpExecArray | null = regex.exec(haystack);

  while (match !== null) {
    if (!isAllowedOperatorPersonaReference(haystack, match.index)) {
      violations.push({
        file,
        pattern: MARKETING_SURFACE_BANNED_PERSONA_PATTERN.source,
        excerpt: match[0],
      });
    }

    match = regex.exec(haystack);
  }
}

/** Returns violations when marketing surfaces leak internal links, backlog labels, or Operator persona voice. */
export function findMarketingSurfaceHygieneViolations(repoRoot: string): MarketingSurfaceHygieneViolation[] {
  const violations: MarketingSurfaceHygieneViolation[] = [];

  for (const relativeRoot of MARKETING_SURFACE_SCAN_RELATIVE_ROOTS) {
    for (const file of listSourceFiles(repoRoot, relativeRoot)) {
      const source = readFileSync(join(repoRoot, file), "utf8");

      for (const pattern of MARKETING_SURFACE_BANNED_LINK_TARGET_PATTERNS) {
        scanSourceForPattern(source, pattern, file, violations);
      }

      for (const prefix of MARKETING_SURFACE_BANNED_INTERNAL_ROUTE_PREFIXES) {
        scanSourceForPattern(source, `href=["'\`]${prefix}`, file, violations);
        scanSourceForPattern(source, `href=\\{["'\`]${prefix}`, file, violations);
      }

      scanSourceForPattern(source, MARKETING_SURFACE_BANNED_BACKLOG_LABEL_PATTERN, file, violations);
      scanOperatorPersonaViolations(source, file, violations);
    }
  }

  return violations;
}
