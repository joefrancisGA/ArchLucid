/**
 * GTM M-99 — Run LHCI against an owner-chosen UI origin (ACCEPTANCE_BASE_URL).
 * Does not start a local mock server; point at staging / production-like / local UI already running.
 *
 *   ACCEPTANCE_BASE_URL=https://staging.example npm run lighthouse:acceptance
 *   ACCEPTANCE_STORAGE_STATE=./.local/acceptance-storage.json npm run lighthouse:acceptance
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(scriptDir, "..");

function resolveAcceptanceBaseUrl() {
  const acceptance = process.env.ACCEPTANCE_BASE_URL?.trim();

  if (acceptance) {
    return acceptance.replace(/\/+$/, "");
  }

  const staging = process.env.STAGING_BASE_URL?.trim();

  if (staging) {
    return staging.replace(/\/+$/, "");
  }

  return "http://127.0.0.1:3000";
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: uiRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`));
    });
  });
}

async function main() {
  const baseUrl = resolveAcceptanceBaseUrl();

  console.log(`[lighthouse:acceptance] target=${baseUrl}`);
  console.log(
    `[lighthouse:acceptance] storageState=${process.env.ACCEPTANCE_STORAGE_STATE?.trim() || "(none — public routes only)"}`,
  );
  console.log(
    `[lighthouse:acceptance] runs=${process.env.LIGHTHOUSE_ACCEPTANCE_RUNS ?? "3"} (LHCI uses median when >1)`,
  );

  await runCommand("npx", ["lhci", "autorun", "--config=./lighthouserc.acceptance.cjs"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
