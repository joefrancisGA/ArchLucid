import { describe, expect, it, vi } from "vitest";

import {
  INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT,
  readInfraEvidenceRecentScopes,
  recordInfraEvidenceRecentScope,
} from "@/lib/infra-evidence/infra-evidence-recent-scope";

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: vi.fn(() => ({
    tenantId: "tenant-a",
    workspaceId: "workspace-a",
    projectId: "project-a",
    workspaceLabel: "",
    projectLabel: "",
  })),
}));

describe("infra-evidence-recent-scope", () => {
  it("records and reads recent scopes from tenant-scoped session storage", () => {
    const storage = new Map<string, string>();
    const sessionStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      key: () => null,
      length: 0,
    };
    const dispatchEvent = vi.fn();

    vi.stubGlobal("sessionStorage", sessionStorageMock);
    vi.stubGlobal("window", {
      sessionStorage: sessionStorageMock,
      dispatchEvent,
    });

    recordInfraEvidenceRecentScope({
      label: "gateway · AC-2 · Account management",
      href: "/governance/infrastructure/ask?cloudResourceId=res-1",
    });

    expect(storage.has("archlucid.infra-evidence.recent-scopes.tenant-a")).toBe(true);
    expect(readInfraEvidenceRecentScopes("/governance/infrastructure/ask?cloudResourceId=res-1")).toEqual([]);
    expect(readInfraEvidenceRecentScopes()).toEqual([
      {
        label: "gateway · AC-2 · Account management",
        href: "/governance/infrastructure/ask?cloudResourceId=res-1",
        savedAtMs: expect.any(Number),
      },
    ]);
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT }),
    );
  });
});
