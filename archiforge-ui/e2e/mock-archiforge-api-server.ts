import http from "node:http";

import {
  FIXTURE_MANIFEST_ID,
  FIXTURE_RUN_ID,
  fixtureArtifactDescriptorsNonEmpty,
  fixtureManifestSummary,
  fixtureRunDetail,
} from "./fixtures/index";

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload, "utf8"),
  });
  res.end(payload);
}

/**
 * Minimal HTTP stub for ArchiForge API routes used by RSC run/manifest pages.
 * Payloads come from the same typed fixtures as Playwright browser mocks.
 */
export function startMockArchiforgeApiServer(port: number): Promise<{ stop: () => Promise<void> }> {
  const host = "127.0.0.1";
  const server = http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", `http://${host}`);

    if (req.method === "GET" && u.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");

      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();

      return;
    }

    const pathname = decodeURIComponent(u.pathname);

    const runMatch = /^\/api\/authority\/runs\/([^/]+)$/.exec(pathname);

    if (runMatch) {
      const runId = runMatch[1];

      if (runId === FIXTURE_RUN_ID) {
        sendJson(res, 200, fixtureRunDetail());
      } else {
        sendJson(res, 404, { detail: "Run not found." });
      }

      return;
    }

    const summaryMatch = /^\/api\/authority\/manifests\/([^/]+)\/summary$/.exec(pathname);

    if (summaryMatch) {
      const manifestId = summaryMatch[1];

      if (manifestId === FIXTURE_MANIFEST_ID) {
        sendJson(res, 200, fixtureManifestSummary());
      } else {
        sendJson(res, 404, { detail: "Manifest not found." });
      }

      return;
    }

    const artifactsMatch = /^\/api\/artifacts\/manifests\/([^/]+)$/.exec(pathname);

    if (artifactsMatch) {
      const manifestId = artifactsMatch[1];

      if (manifestId === FIXTURE_MANIFEST_ID) {
        sendJson(res, 200, fixtureArtifactDescriptorsNonEmpty());
      } else {
        sendJson(res, 200, []);
      }

      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: "E2E mock: no handler for this path." }));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      resolve({
        stop: () =>
          new Promise((res, rej) => {
            server.close((err) => {
              if (err) {
                rej(err);
              } else {
                res();
              }
            });
          }),
      });
    });
  });
}
