import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSponsorRoiEnvironmentSavingsQuery = vi.fn();

vi.mock("@/hooks/use-sponsor-roi-environment-savings-query", () => ({
  useSponsorRoiEnvironmentSavingsQuery: (...args: unknown[]) =>
    useSponsorRoiEnvironmentSavingsQuery(...args),
}));

import { SponsorRoiEnvironmentSavingsSection } from "./SponsorRoiEnvironmentSavingsSection";

describe("SponsorRoiEnvironmentSavingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty copy only when load succeeds with no slices", () => {
    useSponsorRoiEnvironmentSavingsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SponsorRoiEnvironmentSavingsSection />);

    expect(screen.getByText(/No tagged environment savings yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("exec-roi-environment-load-failed")).not.toBeInTheDocument();
  });

  it("shows load failure with retry instead of empty savings copy", () => {
    const refetch = vi.fn();
    useSponsorRoiEnvironmentSavingsQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("HTTP 503"),
      refetch,
    });

    render(<SponsorRoiEnvironmentSavingsSection />);

    expect(screen.getByTestId("exec-roi-environment-load-failed")).toBeInTheDocument();
    expect(screen.queryByText(/No tagged environment savings yet/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("exec-roi-environment-retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
