import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const committedReviewMock = vi.hoisted(() => ({ value: false }));
const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

import { useEffectiveNavCommittedArchitectureReview } from "./use-effective-nav-committed-architecture-review";

describe("useEffectiveNavCommittedArchitectureReview", () => {
  beforeEach(() => {
    committedReviewMock.value = false;
    buyerPolishedMock.value = false;
  });

  it("is false only when the tenant has no committed review outside the buyer-polished shell", () => {
    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(false);
  });

  it("is true once the tenant has a committed review", () => {
    committedReviewMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });

  // The buyer-polished walkthrough must show the whole catalog even though its tenant never committed.
  it("is true in the buyer-polished shell without a committed review", () => {
    buyerPolishedMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });

  it("is true when both inputs hold", () => {
    committedReviewMock.value = true;
    buyerPolishedMock.value = true;

    const { result } = renderHook(() => useEffectiveNavCommittedArchitectureReview());

    expect(result.current).toBe(true);
  });
});
