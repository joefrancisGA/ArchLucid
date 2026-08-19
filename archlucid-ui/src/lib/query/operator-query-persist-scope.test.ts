import { describe, expect, it } from "vitest";

import { buildOperatorQueryPersistStorageKey } from "@/lib/query/operator-query-persist-scope";

describe("operator-query-persist-scope (TB-2165)", () => {
  it("scopes storage key by build buster, user subject, and tenant scope", () => {
    const keyA = buildOperatorQueryPersistStorageKey("tenant-a:w:p", "user-1", "build-a");
    const keyB = buildOperatorQueryPersistStorageKey("tenant-b:w:p", "user-1", "build-a");
    const keyC = buildOperatorQueryPersistStorageKey("tenant-a:w:p", "user-2", "build-a");
    const keyD = buildOperatorQueryPersistStorageKey("tenant-a:w:p", "user-1", "build-b");

    expect(keyA).not.toBe(keyB);
    expect(keyA).not.toBe(keyC);
    expect(keyA).not.toBe(keyD);
    expect(keyA).toContain("build-a");
    expect(keyA).toContain("user-1");
    expect(keyA).toContain("tenant-a:w:p");
  });
});
