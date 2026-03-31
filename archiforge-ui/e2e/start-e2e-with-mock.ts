/**
 * Playwright webServer entry: serves typed fixture JSON on a loopback port, then starts Next.js
 * with ARCHIFORGE_API_BASE_URL pointing at that stub (RSC run/manifest fetches).
 */
import { spawn } from "node:child_process";

import { startMockArchiforgeApiServer } from "./mock-archiforge-api-server";

const MOCK_PORT = Number(process.env.E2E_MOCK_API_PORT ?? "18765");
const MOCK_BASE = `http://127.0.0.1:${MOCK_PORT}`;

async function main(): Promise<void> {
  const mock = await startMockArchiforgeApiServer(MOCK_PORT);

  const child = spawn("npx", ["next", "start", "-p", "3000"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ARCHIFORGE_API_BASE_URL: MOCK_BASE },
    cwd: process.cwd(),
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
