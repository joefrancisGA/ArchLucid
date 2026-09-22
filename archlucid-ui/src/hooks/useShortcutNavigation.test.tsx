import { fireEvent, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { routerPush, mockPathname, mockWorkspaceMode } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  mockPathname: vi.fn(() => "/"),
  mockWorkspaceMode: vi.fn(() => ({
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  })),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: routerPush }),
    usePathname: () => mockPathname(),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => mockWorkspaceMode(),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

vi.mock("@/lib/desk-continuity-preference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/desk-continuity-preference")>();

  return {
    ...actual,
    readCachedLastOpenArchitectureId: () => "architecture-identity-001",
    readCachedDeskContinuity: () => ({
      lastOpenArchitectureId: "architecture-identity-001",
      lastOpenReviewId: null,
      lastOpenDraftId: null,
      lastVisitWatermarkUtc: null,
    }),
  };
});

vi.mock("@/lib/operations/in-flight-operations-store", () => ({
  getInFlightOperations: () => [],
  subscribeInFlightOperations: () => () => {},
}));

const { mockReadCachedLastOpenArchitectureId } = vi.hoisted(() => ({
  mockReadCachedLastOpenArchitectureId: vi.fn(() => null as string | null),
}));

vi.mock("@/lib/desk-continuity-preference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/desk-continuity-preference")>();

  return {
    ...actual,
    readCachedLastOpenArchitectureId: () => mockReadCachedLastOpenArchitectureId(),
    readCachedDeskContinuity: () => actual.readCachedDeskContinuity(),
  };
});

import {
  ARCHITECTURES_NEW_PATH,
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedGraphPath,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";

import { useShortcutNavigation } from "./useShortcutNavigation";

describe("useShortcutNavigation", () => {
  beforeEach(() => {
    routerPush.mockClear();
    mockReadCachedLastOpenArchitectureId.mockReturnValue(null);
    mockPathname.mockReturnValue("/");
    mockWorkspaceMode.mockReturnValue({
      mode: "guided",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: false,
      setAndPersist: vi.fn(),
    });
  });

  it("returns SHORTCUTS for display", () => {
    const { result } = renderHook(() => useShortcutNavigation());

    expect(result.current.shortcuts.length).toBeGreaterThan(0);
    expect(result.current.shortcuts.some((s) => s.key === "alt+n")).toBe(true);
  });

  it("calls router.push with /runs/new when Alt+N is pressed", () => {
    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "n", altKey: true });

    expect(routerPush).toHaveBeenCalledWith(ARCHITECTURES_NEW_PATH);
  });

  it("SN-019: Working Alt+N opens nested start-review under last-open architecture", () => {
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });
    mockReadCachedLastOpenArchitectureId.mockReturnValue("architecture-identity-001");

    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "n", altKey: true });

    expect(routerPush).toHaveBeenCalledWith(
      startReviewFromArchitectureNestedHref("architecture-identity-001"),
    );
  });

  it("opens unscoped Compare from Overview with Alt+C", () => {
    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "c", altKey: true });

    expect(routerPush).toHaveBeenCalledWith("/insights/compare-two-reviews");
  });

  it("prefills Compare base review when Alt+C is pressed on review-detail in Guided mode", () => {
    mockPathname.mockReturnValue("/architecture/reviews/run-abc");

    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "c", altKey: true });

    expect(routerPush).toHaveBeenCalledWith("/insights/compare-two-reviews?priorRunId=run-abc");
  });

  it("prefills nested Compare base review when Alt+C is pressed on review-detail in Working mode", () => {
    const architectureId = "architecture-identity-001";

    mockPathname.mockReturnValue("/architecture/reviews/run-abc");
    mockReadCachedLastOpenArchitectureId.mockReturnValue(architectureId);
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });

    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "c", altKey: true });

    expect(routerPush).toHaveBeenCalledWith(
      `${architectureNestedComparePath(architectureId)}?leftRunId=run-abc`,
    );
  });

  it("scopes Ask to the open review when Alt+A is pressed on review-detail in Working mode", () => {
    const architectureId = "architecture-identity-001";

    mockPathname.mockReturnValue("/architecture/reviews/run-abc");
    mockReadCachedLastOpenArchitectureId.mockReturnValue(architectureId);
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });

    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "a", altKey: true });

    expect(routerPush).toHaveBeenCalledWith(
      `${architectureNestedAskPath(architectureId)}?runId=run-abc`,
    );
  });

  it("scopes evidence graph to the open review when Alt+Y is pressed on review-detail in Working mode", () => {
    const architectureId = "architecture-identity-001";

    mockPathname.mockReturnValue("/architecture/reviews/run-abc");
    mockReadCachedLastOpenArchitectureId.mockReturnValue(architectureId);
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });

    renderHook(() => useShortcutNavigation());

    fireEvent.keyDown(window, { key: "y", altKey: true });

    expect(routerPush).toHaveBeenCalledWith(
      `${architectureNestedGraphPath(architectureId)}?runId=run-abc`,
    );
  });

  it("invokes onHelpRequested for Shift+?", () => {
    const onHelpRequested = vi.fn();

    renderHook(() => useShortcutNavigation({ onHelpRequested }));

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    expect(onHelpRequested).toHaveBeenCalledTimes(1);
  });
});
