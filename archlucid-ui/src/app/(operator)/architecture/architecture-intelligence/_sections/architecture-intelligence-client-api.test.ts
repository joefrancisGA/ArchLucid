import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

import {
  buildRequest,
  canAnalyzeHydratedReviewFromIntake,
  requiresArchitectureDescriptionForMutation,
  getJson,
  postJson,
  primaryDescriptionFromSources,
  shouldRequestGoldenFixtureForGoldenTest,
} from "./architecture-intelligence-client-api";

describe("architecture-intelligence-client-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards operator scope headers on getJson proxy requests", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await getJson<{ ok: boolean }>("/api/proxy/v1/architecture-intelligence/golden-fixture");

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers on postJson proxy requests", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await postJson<{ ok: boolean }>("/api/proxy/v1/architecture-intelligence/run", { sourceTexts: [] });

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
  });

  it("does not treat an attachment-only source as the primary architecture description", () => {
    expect(
      primaryDescriptionFromSources([
        {
          fileName: "network-diagram.png",
          contentType: "image/png",
          content: "binary attachment metadata",
        },
      ]),
    ).toBe("");
  });
  it("adds canonical architecture description when hydrated intake is attachment-only", () => {
    const request = buildRequest(
      "Operator-authored architecture brief.",
      "",
      {},
      {
        hydratedSourceTexts: [
          {
            fileName: "network-diagram.png",
            contentType: "image/png",
            content: "attachment body",
          },
        ],
      },
    );

    expect(request.sourceTexts).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "Operator-authored architecture brief.",
      },
      {
        fileName: "network-diagram.png",
        contentType: "image/png",
        content: "attachment body",
      },
    ]);
  });

  it("requests golden fixture for attachment-only hydrated intake with empty description field", () => {
    expect(
      shouldRequestGoldenFixtureForGoldenTest("", [
        {
          fileName: "network-diagram.png",
          contentType: "image/png",
          content: "attachment body",
        },
      ]),
    ).toBe(true);
  });

  it("drops whitespace-only hydrated sources when the architecture description field is empty", () => {
    const request = buildRequest(
      "   ",
      "",
      {},
      {
        hydratedSourceTexts: [
          {
            fileName: "architecture-description.txt",
            contentType: "text/plain",
            content: "   \n",
          },
          {
            fileName: "network-diagram.png",
            contentType: "image/png",
            content: "Attachment body",
          },
        ],
      },
    );

    expect(request.sourceTexts).toEqual([
      {
        fileName: "network-diagram.png",
        contentType: "image/png",
        content: "Attachment body",
      },
    ]);
  });


  it("canAnalyzeHydratedReviewFromIntake is true for attachment-only hydrated intake with an active run", () => {
    expect(
      canAnalyzeHydratedReviewFromIntake("loaded", "run-1", "", [
        {
          fileName: "network-diagram.png",
          contentType: "image/png",
          content: "attachment body",
        },
      ]),
    ).toBe(true);
  });
  it("requiresArchitectureDescriptionForMutation is true when textarea and hydrated rows are blank", () => {
    expect(
      requiresArchitectureDescriptionForMutation("  ", [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "  ",
        },
      ]),
    ).toBe(true);
  });
  it("drops whitespace-only non-canonical hydrated rows when operator overrides canonical description", () => {
    const request = buildRequest(
      "Operator brief.",
      "",
      {},
      {
        hydratedSourceTexts: [
          {
            fileName: "architecture-description.txt",
            contentType: "text/plain",
            content: "   ",
          },
          {
            fileName: "stale-notes.txt",
            contentType: "text/plain",
            content: "\n\t",
          },
          {
            fileName: "network-diagram.png",
            contentType: "image/png",
            content: "Attachment body",
          },
        ],
      },
    );

    expect(request.sourceTexts).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "Operator brief.",
      },
      {
        fileName: "network-diagram.png",
        contentType: "image/png",
        content: "Attachment body",
      },
    ]);
  });
})

