import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { readSecureNowPinnedPathId, writeSecureNowPinnedPathId } from "@/lib/product-line/securenow-stickiness";

import { SecureNowPinPathButton } from "./SecureNowPinPathButton";

const originalScope = { tenantId: "tenant-a", workspaceId: "workspace-a", projectId: "project-a" };
let scope = originalScope;

vi.mock("@/hooks/use-operator-scope-query-key", () => ({ useOperatorScopeQueryKey: () => scope }));

describe("SecureNowPinPathButton", () => {
  beforeEach(() => {
    scope = originalScope;
    window.localStorage.clear();
  });

  it.each([
    { ...originalScope, workspaceId: "workspace-b" },
    { ...originalScope, tenantId: "tenant-b" },
  ])("uses the current watch state in $tenantId/$workspaceId", (nextScope) => {
    writeSecureNowPinnedPathId(originalScope, "path-a");
    writeSecureNowPinnedPathId(nextScope, "path-b");
    const { rerender } = render(<SecureNowPinPathButton pathId="path-a" />);
    expect(screen.getByRole("button", { name: "Stop watching this path" })).toBeInTheDocument();

    scope = nextScope;
    rerender(<SecureNowPinPathButton pathId="path-a" />);
    fireEvent.click(screen.getByRole("button", { name: "Watch this path" }));

    expect(readSecureNowPinnedPathId(originalScope)).toBe("path-a");
    expect(readSecureNowPinnedPathId(nextScope)).toBe("path-a");
    expect(screen.getByRole("button", { name: "Stop watching this path" })).toBeInTheDocument();
  });
});
