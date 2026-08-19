/**
 * Preflight cleanup before `next build`.
 *
 * `.next/export`: Next on Windows sometimes fails with ENOTEMPTY when removing export during the
 * build; Node's recursive `rmSync` matches `rm -rf` for non-empty dirs. Retries soften AV/indexer locks.
 *
 * Windows only — `.next/server` + `.next/standalone`: Removing only `export` can leave stale server
 * output from aborted runs (mixed with fresh emits). That inconsistency surfaces as missing
 * `pages-manifest.json` during "Collecting page data" or ENOENT renaming `export/500.html` after
 * static generation. Docker/Linux CI paths are unchanged (export-only cleanup there).
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const nextDir = join(process.cwd(), ".next");
const exportDir = join(nextDir, "export");

const targets = [
  exportDir,
  ...(process.platform === "win32" ? [join(nextDir, "server"), join(nextDir, "standalone")] : []),
];

async function removeWithRetries(absPath) {
  if (!existsSync(absPath))
    return true;

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      rmSync(absPath, { recursive: true, force: true });

      return true;
    } catch {
      await delay(100 * (attempt + 1));
    }
  }

  return false;
}

async function main() {
  for (const t of targets) {
    if (!(await removeWithRetries(t))) {
      process.stderr.write(`Failed to remove after retries: ${t}\n`);
      process.exit(1);
    }
  }

  process.exit(0);
}

await main();
