import { afterEach, describe, expect, it, vi } from "vitest";

import { INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE } from "@/lib/infra-evidence/infra-evidence-mermaid-png-unavailable";

import {
  explainMermaidExportPngFailure,
  logUpstreamNonSuccess,
  readUpstreamProblemSummary,
} from "./proxy-forward-upstream-errors";

const EXPORT_PNG_PATH =
  "v1/infra-evidence/snapshots/fb0c5cd7-b8e9-48a5-84a9-89385edd6dd1/mermaid/export.png";

function problemResponse(body: unknown, contentType = "application/problem+json"): Response {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { "content-type": contentType },
  });
}

describe("readUpstreamProblemSummary", () => {
  it("keeps the response body readable after extracting title and detail", async () => {
    const upstream = problemResponse({
      title: "Bad Request",
      detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    });

    const summary = await readUpstreamProblemSummary(upstream);

    expect(summary).toEqual({
      title: "Bad Request",
      detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    });
    await expect(upstream.json()).resolves.toMatchObject({
      detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    });
  });

  it("ignores non-JSON error bodies", async () => {
    const upstream = new Response("nope", {
      status: 502,
      headers: { "content-type": "text/plain" },
    });

    await expect(readUpstreamProblemSummary(upstream)).resolves.toBeUndefined();
  });
});

describe("explainMermaidExportPngFailure", () => {
  it("explains a rasterizer 400 on the PNG export path", () => {
    const reason = explainMermaidExportPngFailure(
      EXPORT_PNG_PATH,
      400,
      INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    );

    expect(reason).toContain("Graphviz fdp");
    expect(reason).toContain("Mermaid CLI");
    expect(reason).toContain("on-screen diagram is unchanged");
  });

  it("explains an empty Mermaid source separately from a rasterizer miss", () => {
    const reason = explainMermaidExportPngFailure(
      EXPORT_PNG_PATH,
      400,
      "Mermaid source is unavailable for the requested mode.",
    );

    expect(reason).toContain("no Mermaid text");
    expect(reason).not.toContain("Graphviz fdp");
  });

  it("leaves unrelated failures unexplained", () => {
    expect(explainMermaidExportPngFailure("v1/runs", 400, "Validation failed.")).toBeUndefined();
    expect(explainMermaidExportPngFailure(EXPORT_PNG_PATH, 404, "Snapshot was not found.")).toBeUndefined();
  });
});

describe("logUpstreamNonSuccess", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the rasterizer reason on the upstream_non_success line", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const upstream = problemResponse({
      title: "Bad Request",
      detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    });

    await logUpstreamNonSuccess("GET", EXPORT_PNG_PATH, 400, "33b07441-dddf-43d0-b812-087dee12437d", upstream);

    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    const logged = JSON.parse(line) as Record<string, string>;

    expect(logged).toMatchObject({
      component: "archlucid-ui-proxy",
      event: "upstream_non_success",
      method: "GET",
      path: EXPORT_PNG_PATH,
      status: 400,
      correlationId: "33b07441-dddf-43d0-b812-087dee12437d",
      title: "Bad Request",
      detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
    });
    expect(logged.reason).toContain("server PNG file");
    expect(logged.reason).toContain("browser can still save a PNG");
  });
});
