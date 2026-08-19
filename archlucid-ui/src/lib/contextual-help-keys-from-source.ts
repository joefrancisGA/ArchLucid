import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Only keys rendered by {@link ContextualHelp} in production JSX (not deprecated header props). */
const contextualHelpUsage = /<ContextualHelp[^>]*\bhelpKey=["']([^"']+)["']/g;

function isSkippableSourceFile(filePath: string): boolean {
  const base = filePath.replace(/\\/g, "/");

  if (base.includes("/node_modules/") || base.includes("/.next/")) {
    return true;
  }

  if (base.endsWith(".test.ts") || base.endsWith(".test.tsx")) {
    return true;
  }

  if (base.endsWith(".spec.ts") || base.endsWith(".spec.tsx")) {
    return true;
  }

  if (base.endsWith("/contextual-help-keys-from-source.ts")) {
    return true;
  }

  return false;
}

function walkSourceFiles(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);

    if (name === "node_modules" || name === ".next") {
      continue;
    }

    const st = statSync(full);

    if (st.isDirectory()) {
      walkSourceFiles(full, out);

      continue;
    }

    if (!/\.(tsx|ts)$/.test(name) || isSkippableSourceFile(full)) {
      continue;
    }

    out.push(full);
  }
}

/**
 * Collects every `<ContextualHelp helpKey="…" />` string literal from production `src`.
 */
export function collectContextualHelpKeysFromSource(srcRoot: string): string[] {
  const files: string[] = [];
  walkSourceFiles(srcRoot, files);
  const keys = new Set<string>();

  for (const file of files) {
    const text = readFileSync(file, "utf8");

    if (!text.includes("<ContextualHelp")) {
      continue;
    }

    contextualHelpUsage.lastIndex = 0;
    let match = contextualHelpUsage.exec(text);

    while (match !== null) {
      keys.add(match[1]);
      match = contextualHelpUsage.exec(text);
    }
  }

  return [...keys].sort((a, b) => a.localeCompare(b));
}

/** `src` directory for archlucid-ui (parent of `lib` where this file lives). */
export function defaultArchlucidUiSrcRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}
