/**
 * TB-693 — Run Lighthouse CI against a mock-backed production standalone server.
 * Reuses `e2e/start-e2e-with-mock.ts` (deterministic loopback API + Next standalone).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(scriptDir, "..");

const port = process.env.MOCK_E2E_PORT ?? process.env.PORT ?? "3000";
const baseUrl = `http://127.0.0.1:${port}`;

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: uiRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
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

function waitForHttpOk(url, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      const request = http.get(url, (response) => {
        response.resume();

        if (response.statusCode !== undefined && response.statusCode < 500) {
          resolve();
          return;
        }

        setTimeout(poll, 1_000);
      });

      request.on("error", () => {
        setTimeout(poll, 1_000);
      });
    };

    poll();
  });
}

function startMockServer() {
  const standaloneServer = path.join(uiRoot, ".next", "standalone", "server.js");

  if (!existsSync(standaloneServer)) {
    throw new Error(`Missing ${standaloneServer}. Run "npm run build" in archlucid-ui first.`);
  }

  const child = spawn(
    "npx",
    ["tsx", "--tsconfig", "e2e/tsconfig.json", "e2e/start-e2e-with-mock.ts"],
    {
      cwd: uiRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        MOCK_E2E_SKIP_NEXT_BUILD: "1",
        PORT: port,
        MOCK_E2E_PORT: port,
        NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "true",
        NEXT_PUBLIC_DEMO_STATIC_OPERATOR: process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR ?? "true",
        NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR: process.env.NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR ?? "1",
        NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED: process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED ?? "true",
        NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES:
          process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES ?? "1",
      },
    },
  );

  return child;
}

async function main() {
  const skipBuild = process.env.MOCK_E2E_SKIP_NEXT_BUILD === "1";

  if (!skipBuild) {
    await runCommand("npm", ["run", "build"]);
  }

  const server = startMockServer();

  const stopServer = () => {
    if (!server.killed) {
      server.kill("SIGTERM");
    }
  };

  process.on("SIGINT", () => {
    stopServer();
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    stopServer();
    process.exit(1);
  });

  try {
    await waitForHttpOk(`${baseUrl}/welcome`);
    await runCommand("npx", ["lhci", "autorun", "--config=./lighthouserc.cjs"]);
  }
  finally {
    stopServer();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
