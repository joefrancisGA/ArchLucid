import { describe, expect, it, vi } from "vitest";

import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

describe("downloadScopedProxyFileGet", () => {
  it("does not save a 200 HTML page when the caller omitted content-type prefixes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<!doctype html><html></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await expect(
      downloadScopedProxyFileGet("/api/proxy/v1/authority/reviews/run-1/decision-receipt", {
        accept: "application/json",
        defaultFileName: "decision-receipt-run-1.json",
      }),
    ).rejects.toThrow(/text\/html/);

    expect(createObjectUrl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });

  it("still saves a 200 JSON body when content-type prefixes are omitted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await downloadScopedProxyFileGet("/api/proxy/v1/authority/reviews/run-1/decision-receipt", {
      accept: "application/json",
      defaultFileName: "decision-receipt-run-1.json",
    });

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });

  it("still saves HTML when the caller declared a text/html prefix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<html></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    );
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

    await downloadScopedProxyFileGet("/api/proxy/v1/authority/reviews/run-1/package", {
      accept: "text/html",
      defaultFileName: "run-package-run-1.html",
      expectedContentTypePrefixes: ["text/html"],
    });

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    createObjectUrl.mockRestore();
  });
});
