import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptPostAuthInvitation,
  createPostAuthWorkspace,
  fetchPostAuthBootstrapStatus,
  initiatePostAuthAccessRequest,
  selectPostAuthWorkspace,
} from "@/lib/auth/post-auth-bootstrap-api";

describe("fetchPostAuthBootstrapStatus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws bootstrap_status_failed when the proxy returns 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(fetchPostAuthBootstrapStatus()).rejects.toThrow("bootstrap_status_failed");
  });
});

describe("createPostAuthWorkspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns generic failure when the proxy responds with 403", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    const result = await createPostAuthWorkspace({
      workspaceName: "Workspace",
      organizationName: "Org",
      termsAccepted: true,
      includeDemoSeed: false,
    });

    expect(result.succeeded).toBe(false);
    expect(result.customerMessage).toBe("Workspace creation could not be completed.");
  });
});

describe("initiatePostAuthAccessRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true only for HTTP 202 Accepted", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 202 }));

    await expect(initiatePostAuthAccessRequest("hello")).resolves.toBe(true);
  });

  it("returns false when the API responds with 200 OK", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(initiatePostAuthAccessRequest()).resolves.toBe(false);
  });

  it("returns false when the proxy responds with 403", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(initiatePostAuthAccessRequest("hello")).resolves.toBe(false);
  });
});

describe("acceptPostAuthInvitation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when the proxy responds with 403", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(acceptPostAuthInvitation("inv-1", null)).resolves.toBeNull();
  });
});

describe("selectPostAuthWorkspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when the proxy responds with 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(
      selectPostAuthWorkspace(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ),
    ).resolves.toBeNull();
  });
});
