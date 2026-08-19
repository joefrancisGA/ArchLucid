import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { SessionIdleTimeoutGuard } from "@/components/SessionIdleTimeoutGuard";

const IDLE_MS = 30 * 60 * 1000;

describe("SessionIdleTimeoutGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "location", {
      value: { pathname: "/architecture/reviews/123", search: "?tab=findings" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("navigates to the cleaner /auth/session-expired route (not /auth/signin) after idle timeout", () => {
    render(<SessionIdleTimeoutGuard />);

    vi.advanceTimersByTime(IDLE_MS);

    expect(pushMock).toHaveBeenCalledTimes(1);

    const [destination] = pushMock.mock.calls[0] as [string];

    expect(destination.startsWith("/auth/session-expired?reason=idle-timeout&returnUrl=")).toBe(true);
    expect(destination).not.toContain("/auth/signin");
  });

  it("preserves the current path and query string in the returnUrl", () => {
    render(<SessionIdleTimeoutGuard />);

    vi.advanceTimersByTime(IDLE_MS);

    const [destination] = pushMock.mock.calls[0] as [string];
    const encoded = encodeURIComponent("/architecture/reviews/123?tab=findings");

    expect(destination).toBe(`/auth/session-expired?reason=idle-timeout&returnUrl=${encoded}`);
  });

  it("does not navigate before the idle threshold elapses", () => {
    render(<SessionIdleTimeoutGuard />);

    vi.advanceTimersByTime(IDLE_MS - 1000);

    expect(pushMock).not.toHaveBeenCalled();
  });
});
