/**
 * Runs the all-routes screenshot spec with MOCK_E2E_SKIP_NEXT_BUILD=1 so Playwright
 * does not run `npm run build` in the webServer command (expects `npm run build` already done).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, "..");

const result = spawnSync(
  "npm",
  ["run", "e2e:mock", "--", "capture-all-screenshots.spec.ts"],
  {
    stdio: "inherit",
    cwd: projectRoot,
    shell: true,
    env: { ...process.env, MOCK_E2E_SKIP_NEXT_BUILD: "1" },
  }
);

process.exit(result.status ?? 1);
