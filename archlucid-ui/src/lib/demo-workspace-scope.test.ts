import { describe, expect, it } from "vitest";

import {
  isPinnedDemoWorkspaceRunId,
  resolveDemoWorkspaceScopeHeadersForProjectId,
  resolveDemoWorkspaceScopeHeadersForRunId,
  resolveDemoWorkspaceScopeHeadersFromProxyPath,
} from "./demo-workspace-scope";

describe("demo-workspace-scope", () => {
  it("resolves workspace A scope for pinned product tour run id", () => {
    expect(
      resolveDemoWorkspaceScopeHeadersForRunId("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf"),
    ).toEqual({
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-workspace-id": "2b2571e1-1884-62a2-1e8b-15a2a70a0342",
      "x-project-id": "9beb918c-83d4-1385-0486-21f341806c5c",
    });
  });

  it("resolves workspace B scope without hyphen formatting", () => {
    expect(
      resolveDemoWorkspaceScopeHeadersForRunId("61c60d762b8093f946bb2f66fd608b9b"),
    ).toEqual({
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-workspace-id": "3f1a16c3-172e-5632-c53a-3ed16446f603",
      "x-project-id": "49074cdf-bdab-a5fa-789b-09a3e556a8f2",
    });
  });

  it("returns null for unrelated run ids", () => {
    expect(resolveDemoWorkspaceScopeHeadersForRunId("00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(isPinnedDemoWorkspaceRunId("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("resolves workspace A scope for pinned product tour project id", () => {
    expect(
      resolveDemoWorkspaceScopeHeadersForProjectId("9beb918c-83d4-1385-0486-21f341806c5c"),
    ).toEqual({
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-workspace-id": "2b2571e1-1884-62a2-1e8b-15a2a70a0342",
      "x-project-id": "9beb918c-83d4-1385-0486-21f341806c5c",
    });
  });

  it("returns null for unrelated project ids", () => {
    expect(resolveDemoWorkspaceScopeHeadersForProjectId("default")).toBeNull();
    expect(resolveDemoWorkspaceScopeHeadersForProjectId("33333333-3333-3333-3333-333333333333")).toBeNull();
  });

  it("extracts pinned demo scope from pilot-run-deltas proxy paths", () => {
    expect(
      resolveDemoWorkspaceScopeHeadersFromProxyPath(
        "v1/pilots/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf/pilot-run-deltas",
      ),
    ).toEqual({
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-workspace-id": "2b2571e1-1884-62a2-1e8b-15a2a70a0342",
      "x-project-id": "9beb918c-83d4-1385-0486-21f341806c5c",
    });
  });
});
