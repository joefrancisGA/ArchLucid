import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OidcTokenExpiryWarningGuard } from "@/components/OidcTokenExpiryWarningGuard";
import {
  SESSION_LAST_ACTIVITY_STORAGE_KEY,
  SESSION_TOKEN_EXPIRY_WARNING_MS,
} from "@/lib/auth/session-idle-timeout";

const ensureAccessTokenFreshMock = vi.hoisted(() => vi.fn(async () => undefined));
const getAccessTokenExpiresAtMsMock = vi.hoisted(() => vi.fn(() => 0));
const isJwtAuthModeMock = vi.hoisted(() => vi.fn(() => true));

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-1/print" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => isJwtAuthModeMock(),
}));

vi.mock("@/lib/oidc/session", () => ({
  ensureAccessTokenFresh: ensureAccessTokenFreshMock,
  getAccessTokenExpiresAtMs: () => getAccessTokenExpiresAtMsMock(),
}));

describe("OidcTokenExpiryWarningGuard (LI-14)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    ensureAccessTokenFreshMock.mockClear();
    getAccessTokenExpiresAtMsMock.mockReturnValue(0);
    isJwtAuthModeMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes shared session activity on print mount", () => {
    render(<OidcTokenExpiryWarningGuard />);

    expect(window.localStorage.getItem(SESSION_LAST_ACTIVITY_STORAGE_KEY)).not.toBeNull();
  });

  it("silently refreshes before the two-minute warning on meeting-safe surfaces", () => {
    const now = Date.now();
    getAccessTokenExpiresAtMsMock.mockReturnValue(
      now + SESSION_TOKEN_EXPIRY_WARNING_MS + 30_000,
    );

    render(<OidcTokenExpiryWarningGuard />);

    vi.advanceTimersByTime(1_100);

    expect(ensureAccessTokenFreshMock).toHaveBeenCalled();
    expect(screen.queryByTestId("session-token-expiry-warning")).toBeNull();
  });

  it("shows a blocking warning when refresh window is exhausted", async () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    const now = new Date("2026-01-01T12:00:00.000Z");
    vi.setSystemTime(now);
    getAccessTokenExpiresAtMsMock.mockReturnValue(now.getTime() + 30_000);

    render(<OidcTokenExpiryWarningGuard />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByTestId("session-token-expiry-warning")).toBeInTheDocument();
    expect(screen.getByTestId("session-token-expiry-warning-refresh")).toBeInTheDocument();
  });
});
