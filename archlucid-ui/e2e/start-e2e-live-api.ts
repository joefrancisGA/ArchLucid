/**
 * Playwright webServer entry for live-API E2E: starts Next.js standalone with
 * ARCHLUCID_API_BASE_URL pointing at the real ArchLucid API (no mock server).
 *
 * Prerequisites: API must already be listening (CI starts it before Playwright).
 * Uses the same standalone asset sync as e2e/start-e2e-with-mock.ts.
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { syncStandaloneRuntimeAssets } from "./sync-standalone-runtime-assets";

const LIVE_API_BASE = process.env.LIVE_API_URL ?? "http://127.0.0.1:5128";

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const standaloneRoot = syncStandaloneRuntimeAssets(projectRoot);
  const serverJs = path.join(standaloneRoot, "server.js");

  console.log(`[e2e-live] Proxying to ArchLucid API at ${LIVE_API_BASE}`);

  const child = spawn(process.execPath, [serverJs], {
    stdio: "inherit",
    env: {
      ...process.env,
      ARCHLUCID_API_BASE_URL: LIVE_API_BASE,
      ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS:
        process.env.ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS ?? "true",
      NODE_ENV: "production",
      PORT: process.env.PORT ?? "3000",
      HOSTNAME: "0.0.0.0",
    },
    cwd: standaloneRoot,
  });

  const onSignal = (): void => {
    child.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  child.on("exit", (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
