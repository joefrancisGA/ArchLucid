import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const helpKeyProp = /\bhelpKey=["']([^"']+)["']/g;

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
 * Collects every JSX `helpKey` string literal from production `src` (excludes `*.test.*` / `*.spec.*`).
 * Includes keys on `OperatorPageHeader` and any other component that forwards to {@link ContextualHelp}.
 */
export function collectContextualHelpKeysFromSource(srcRoot: string): string[] {
  const files: string[] = [];
  walkSourceFiles(srcRoot, files);
  const keys = new Set<string>();

  for (const file of files) {
    const text = readFileSync(file, "utf8");

    // Count `helpKey=` anywhere (e.g. `<ContextualHelp />` or `OperatorPageHeader` forwarding to it).
    if (!/\bhelpKey=["']/.test(text)) {
      continue;
    }

    helpKeyProp.lastIndex = 0;
    let match = helpKeyProp.exec(text);

    while (match !== null) {
      keys.add(match[1]);
      match = helpKeyProp.exec(text);
    }
  }

  return [...keys].sort((a, b) => a.localeCompare(b));
}

/** `src` directory for archlucid-ui (parent of `lib` where this file lives). */
export function defaultArchlucidUiSrcRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}
