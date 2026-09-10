import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const committedReviewMock = vi.hoisted(() => ({ value: false }));
const evalChromeMock = vi.hoisted(() => ({ value: false }));
const workingModeMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workingModeMock.value ? "working" : "guided",
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: workingModeMock.value,
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.value,
}));

import { useEffectiveNavCommittedArchitectureReview } from "./use-effective-nav-committed-architecture-review";

describe("useEffectiveNavCommittedArchitectureReview", () => {
  beforeEach(() => {
    committedReviewMock.value = false;
    evalChromeMock.value = false;
    workingModeMock.value = false;
  });

  it("is false only when the tenant has no committed review outside eval chrome", () => {
    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(false);
  });

  it("is true once the tenant has a committed review", () => {
    committedReviewMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });

  it("is true in Guided eval chrome without a committed review", () => {
    evalChromeMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });

  it("is true when both inputs hold", () => {
    committedReviewMock.value = true;
    evalChromeMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });

  it("is true in Working mode without a committed review", () => {
    workingModeMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });
});
