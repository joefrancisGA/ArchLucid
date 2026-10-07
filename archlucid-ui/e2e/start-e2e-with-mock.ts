/**
 * Playwright webServer entry: serves typed fixture JSON on a loopback port, then starts Next.js
 * with ARCHLUCID_API_BASE_URL pointing at that stub (RSC run/manifest fetches).
 *
 * Uses `output: "standalone"` from next.config — `next start` does not serve that layout correctly
 * (Next logs a warning and pages break). Mirror Dockerfile: copy static + public into standalone, then
 * `node server.js` from `.next/standalone`.
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { startMockArchlucidApiServer } from "./mock-archlucid-api-server";
import { syncStandaloneRuntimeAssets } from "./sync-standalone-runtime-assets";

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
