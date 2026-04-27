import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(e2eDir, "..");

/**
 * Resolves a path under `archlucid-ui/public/...` regardless of process CWD
 * (Playwright screenshot `path` is relative to cwd when a relative path is used).
 */
export function publicDirUnderUi(...parts: string[]): string {
  return path.join(projectRoot, "public", ...parts);
}
