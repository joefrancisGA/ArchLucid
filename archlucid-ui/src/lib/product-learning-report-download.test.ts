import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

import {
  downloadProductLearningReportMarkdown,
  openProductLearningReportJsonInNewTab,
} from "./product-learning-report-download";

describe("product-learning-report-download", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards operator scope headers on markdown export download", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response("# report", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const anchor = document.createElement("a");
    anchor.click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    await downloadProductLearningReportMarkdown("2026-01-01T00:00:00.000Z");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/proxy/v1/product-learning/report/file?");
    expect(url).toContain("format=markdown");
    const headers = new Headers(init.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards operator scope headers when opening JSON in a new tab", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.stubGlobal("open", vi.fn(() => ({}) as Window));

    await openProductLearningReportJsonInNewTab(null);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/proxy/v1/product-learning/report?format=json");
    const headers = new Headers(init.headers);
    expect(headers.get("x-tenant-id")).toBe(tenantId);
    expect(headers.get("x-workspace-id")).toBe(workspaceId);
    expect(headers.get("x-project-id")).toBe(projectId);

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
