import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import {
  OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY,
  OPERATE_NAV_UNLOCK_STORAGE_KEY,
  readOperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";

describe("useOperateNavUnlockPhase", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
  });

  it("auto-advances to analysis phase after first committed review", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    renderHook(() => useOperateNavUnlockPhase());

    await waitFor(() => {
      expect(readOperateNavUnlockPhase()).toBe(1);
    });

    expect(localStorage.getItem(OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY)).toBe("1");
  });

  it("does not change phase when no committed review exists", async () => {
    renderHook(() => useOperateNavUnlockPhase());

    await waitFor(() => {
      expect(readOperateNavUnlockPhase()).toBe(0);
    });

    expect(localStorage.getItem(OPERATE_NAV_UNLOCK_STORAGE_KEY)).toBeNull();
  });

  it("respects an explicit pilot phase 0 after first committed review", async () => {
    localStorage.setItem(OPERATE_NAV_UNLOCK_STORAGE_KEY, "0");
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    renderHook(() => useOperateNavUnlockPhase());

    await waitFor(() => {
      expect(readOperateNavUnlockPhase()).toBe(0);
    });

    expect(localStorage.getItem(OPERATE_NAV_UNLOCK_STORAGE_KEY)).toBe("0");
    expect(localStorage.getItem(OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY)).toBeNull();
  });
});
