import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navAuthMock = vi.hoisted(() => ({
  isAuthorityLoading: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    isAuthorityLoading: navAuthMock.isAuthorityLoading,
  }),
}));

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

import { useOperatorShellChromeDeferred } from "@/hooks/useOperatorShellChromeDeferred";

describe("useOperatorShellChromeDeferred", () => {
  it("reveals chrome after mount when authority has settled", async () => {
    navAuthMock.isAuthorityLoading = false;

    const { result } = renderHook(() => useOperatorShellChromeDeferred());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("stays deferred after mount while authority is loading", async () => {
    navAuthMock.isAuthorityLoading = true;

    const { result } = renderHook(() => useOperatorShellChromeDeferred());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
