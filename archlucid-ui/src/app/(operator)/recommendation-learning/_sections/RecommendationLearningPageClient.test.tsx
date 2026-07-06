import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const capability = vi.hoisted(() => ({ canMutate: true }));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => capability.canMutate,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { RecommendationLearningPageClient } from "./RecommendationLearningPageClient";

describe("RecommendationLearningPageClient", () => {
  beforeEach(() => {
    capability.canMutate = true;
  });

  it("enables Rebuild tuning profile for Execute+ callers", () => {
    render(<RecommendationLearningPageClient initialProfile={null} initialFailure={null} />);

    expect(screen.getByRole("button", { name: "Rebuild tuning profile" })).not.toBeDisabled();
  });

  it("disables Rebuild tuning profile for Read-only callers", () => {
    capability.canMutate = false;

    render(<RecommendationLearningPageClient initialProfile={null} initialFailure={null} />);

    expect(screen.getByRole("button", { name: "Rebuild tuning profile" })).toBeDisabled();
    expect(
      screen.getByText("Elevated workspace permissions required to rebuild the tuning profile."),
    ).toBeInTheDocument();
  });
});
