/**
 * Next.js on Windows sometimes fails during `next build` with ENOTEMPTY when removing
 * `.next/export`: Node's recursive `rmSync` matches `rm -rf` for non-empty dirs, unlike
 * the empty-directory-only `rmdir` path Next may hit internally. Retries soften AV/indexer locks.
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const exportDir = join(process.cwd(), ".next", "export");

for (let attempt = 0; attempt < 6; attempt++) {
  if (!existsSync(exportDir)) process.exit(0);

  try {
    rmSync(exportDir, { recursive: true, force: true });
    process.exit(0);
  } catch {
    await delay(100 * (attempt + 1));
  }
}

process.exit(1);
