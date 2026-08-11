import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useExecutiveRoiEnvironmentSavingsQuery = vi.fn();

vi.mock("@/hooks/use-executive-roi-environment-savings-query", () => ({
  useExecutiveRoiEnvironmentSavingsQuery: (...args: unknown[]) =>
    useExecutiveRoiEnvironmentSavingsQuery(...args),
}));

import { ExecutiveRoiEnvironmentSavingsSection } from "./ExecutiveRoiEnvironmentSavingsSection";

describe("ExecutiveRoiEnvironmentSavingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty copy only when load succeeds with no slices", () => {
    useExecutiveRoiEnvironmentSavingsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExecutiveRoiEnvironmentSavingsSection />);

    expect(screen.getByText(/No tagged environment savings yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId("exec-roi-environment-load-failed")).not.toBeInTheDocument();
  });

  it("shows load failure with retry instead of empty savings copy", () => {
    const refetch = vi.fn();
    useExecutiveRoiEnvironmentSavingsQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("HTTP 503"),
      refetch,
    });

    render(<ExecutiveRoiEnvironmentSavingsSection />);

    expect(screen.getByTestId("exec-roi-environment-load-failed")).toBeInTheDocument();
    expect(screen.queryByText(/No tagged environment savings yet/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("exec-roi-environment-retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
