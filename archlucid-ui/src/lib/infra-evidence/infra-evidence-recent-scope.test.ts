import { describe, expect, it, vi } from "vitest";

import {
  readInfraEvidenceRecentScopes,
  recordInfraEvidenceRecentScope,
} from "@/lib/infra-evidence/infra-evidence-recent-scope";

describe("infra-evidence-recent-scope", () => {
  it("records and reads recent scopes from session storage", () => {
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

    vi.stubGlobal("sessionStorage", sessionStorageMock);

    recordInfraEvidenceRecentScope({
      label: "resource res-1",
      href: "/governance/infrastructure/ask?cloudResourceId=res-1",
    });

    expect(readInfraEvidenceRecentScopes("/governance/infrastructure/ask?cloudResourceId=res-1")).toEqual([]);
    expect(readInfraEvidenceRecentScopes()).toEqual([
      {
        label: "resource res-1",
        href: "/governance/infrastructure/ask?cloudResourceId=res-1",
        savedAtMs: expect.any(Number),
      },
    ]);
  });
});
