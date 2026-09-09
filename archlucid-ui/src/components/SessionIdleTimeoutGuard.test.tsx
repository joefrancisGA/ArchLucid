import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const workspaceModeMock = vi.hoisted(() => ({
  mode: "guided" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: false,
  setAndPersist: vi.fn(),
}));

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

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

import { SessionIdleTimeoutGuard } from "@/components/SessionIdleTimeoutGuard";
import {
  readIdleDeskRestorePayload,
} from "@/lib/auth/idle-desk-restore";
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WORKING_TIMEOUT_MS,
} from "@/lib/auth/session-idle-timeout";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

const IDLE_MS = SESSION_IDLE_TIMEOUT_MS;

describe("SessionIdleTimeoutGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    workspaceModeMock.mode = "guided";
    workspaceModeMock.isWorkingMode = false;
    workspaceModeMock.mounted = true;
    Object.defineProperty(window, "location", {
      value: { pathname: "/architecture/reviews/123", search: "?tab=findings" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    clearOperatorScopeStorage();
  });

  it("copies operator scope into idle desk restore before clearing live scope", () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });

    render(<SessionIdleTimeoutGuard />);

    vi.advanceTimersByTime(IDLE_MS);

    expect(readIdleDeskRestorePayload()?.scope.projectId).toBe("project-c");
    expect(localStorage.getItem("archlucid_operator_scope_v1")).toBeNull();
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

  it("uses longer idle threshold in Working mode", () => {
    workspaceModeMock.mode = "working";
    workspaceModeMock.isWorkingMode = true;

    render(<SessionIdleTimeoutGuard />);

    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS);

    expect(pushMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SESSION_IDLE_WORKING_TIMEOUT_MS - SESSION_IDLE_TIMEOUT_MS);

    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});
