/**
 * Playwright webServer entry: serves typed fixture JSON on a loopback port, then starts Next.js
 * with ARCHLUCID_API_BASE_URL pointing at that stub (RSC run/manifest fetches).
 *
 * Uses `output: "standalone"` from next.config — `next start` does not serve that layout correctly
 * (Next logs a warning and pages break). Mirror Dockerfile: copy static + public into standalone, then
 * `node server.js` from `.next/standalone`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { startMockArchlucidApiServer } from "./mock-archlucid-api-server";

const MOCK_PORT = Number(process.env.E2E_MOCK_API_PORT ?? "18765");
const MOCK_BASE = `http://127.0.0.1:${MOCK_PORT}`;

/** Mock E2E and screenshot runs expect the static operator fallback when demo mode is on — avoid accidental half-config. */
function assertDemoStaticOperatorNotDisabledWithDemoMode(): void {
  const demoRaw = (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim().toLowerCase();
  const demoOn = demoRaw === "true" || demoRaw === "1";

  if (!demoOn) {
    return;
  }

  const staticRaw = (process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR ?? "").trim().toLowerCase();

  if (staticRaw === "false" || staticRaw === "0") {
    throw new Error(
      "Refusing to start mock E2E: NEXT_PUBLIC_DEMO_STATIC_OPERATOR is disabled while NEXT_PUBLIC_DEMO_MODE is on. " +
        "Operator demo routes will not match static showcase parity. Set NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true or disable demo mode.",
    );
  }
}

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

  /**
   * Trust + privacy SSR read `go-to-market-samples/*.md` when `cwd` is `.next/standalone`
   * (see `readPrivacyPolicyMarkdown` / `readTrustCenterMarkdown`). Copy from monorepo `docs/`.
   */
  const gtmDest = path.join(standaloneRoot, "go-to-market-samples");
  fs.mkdirSync(gtmDest, { recursive: true });
  const monorepoDocs = path.join(projectRoot, "..", "docs");
  const privacySrc = path.join(monorepoDocs, "go-to-market", "PRIVACY_POLICY.md");
  const trustSrc = path.join(monorepoDocs, "trust-center.md");
  if (fs.existsSync(privacySrc)) {
    fs.copyFileSync(privacySrc, path.join(gtmDest, "PRIVACY_POLICY.md"));
  }
  if (fs.existsSync(trustSrc)) {
    fs.copyFileSync(trustSrc, path.join(gtmDest, "trust-center.md"));
  }

  return standaloneRoot;
}

async function main(): Promise<void> {
  assertDemoStaticOperatorNotDisabledWithDemoMode();

  const mock = await startMockArchlucidApiServer(MOCK_PORT);

  const projectRoot = process.cwd();
  const standaloneRoot = syncStandaloneRuntimeAssets(projectRoot);
  const serverJs = path.join(standaloneRoot, "server.js");

  const child = spawn(process.execPath, [serverJs], {
    stdio: "inherit",
    env: {
      ...process.env,
      ARCHLUCID_API_BASE_URL: MOCK_BASE,
      /** RSC `/showcase` uses SSR fetch; force static curated demo rather than unresolved marketing upstream. */
      SHOWCASE_STATIC_ONLY: "1",
      NODE_ENV: "production",
      PORT: process.env.PORT ?? "3000",
      // Bind all interfaces so Playwright can reach 127.0.0.1:3000 (do not inherit shell HOSTNAME).
      HOSTNAME: "0.0.0.0",
      /**
       * Buyer-polished shell + static demo payloads for mock E2E and screenshots. Playwright `webServer.env` also
       * sets these; defaults here keep `npx tsx e2e/start-e2e-with-mock.ts` aligned when run outside Playwright.
       */
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "true",
      NEXT_PUBLIC_DEMO_STATIC_OPERATOR: process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR ?? "true",
      NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR: process.env.NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR ?? "1",
    },
    cwd: standaloneRoot,
  });

  let mockStopped = false;

  const stopMock = async (): Promise<void> => {
    if (mockStopped) {
      return;
    }

    mockStopped = true;
    await mock.stop();
  };

  const onSignal = (): void => {
    child.kill("SIGTERM");
    void stopMock().finally(() => process.exit(0));
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  child.on("exit", (code, signal) => {
    void stopMock().finally(() => {
      process.exit(code ?? (signal ? 1 : 0));
    });
  });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
