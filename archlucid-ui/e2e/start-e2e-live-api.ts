/**
 * Playwright webServer entry for live-API E2E: starts Next.js standalone with
 * ARCHLUCID_API_BASE_URL pointing at the real ArchLucid API (no mock server).
 *
 * Prerequisites: API must already be listening (CI starts it before Playwright).
 * Uses the same standalone asset sync as e2e/start-e2e-with-mock.ts.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LIVE_API_BASE = process.env.LIVE_API_URL ?? "http://127.0.0.1:5128";

function syncStandaloneRuntimeAssets(projectRoot: string): string {
  const standaloneRoot = path.join(projectRoot, ".next", "standalone");
  const serverJs = path.join(standaloneRoot, "server.js");

  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Missing ${serverJs}. Run "npm run build" first (next.config uses output: "standalone").`,
    );
  }

  const staticSrc = path.join(projectRoot, ".next", "static");
  const staticDest = path.join(standaloneRoot, ".next", "static");

  if (!fs.existsSync(staticSrc)) {
    throw new Error(`Missing ${staticSrc} after build; client assets are required for e2e.`);
  }

  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });

  const publicSrc = path.join(projectRoot, "public");
  const publicDest = path.join(standaloneRoot, "public");

  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }
  else {
    fs.mkdirSync(publicDest, { recursive: true });
  }

  return standaloneRoot;
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const standaloneRoot = syncStandaloneRuntimeAssets(projectRoot);
  const serverJs = path.join(standaloneRoot, "server.js");

  // eslint-disable-next-line no-console -- startup diagnostics for CI
  console.log(`[e2e-live] Proxying to ArchLucid API at ${LIVE_API_BASE}`);

  const child = spawn(process.execPath, [serverJs], {
    stdio: "inherit",
    env: {
      ...process.env,
      ARCHLUCID_API_BASE_URL: LIVE_API_BASE,
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
