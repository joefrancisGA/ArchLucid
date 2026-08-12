import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureStructuringFailureNotice } from "@/components/architecture/ArchitectureStructuringFailureNotice";
import { ARCHITECTURE_STRUCTURED_RETRY_LABEL } from "@/lib/architecture/architecture-structured-content-copy";

describe("ArchitectureStructuringFailureNotice", () => {
  it("renders retry and report issue actions", () => {
    const onRetry = vi.fn();

    render(<ArchitectureStructuringFailureNotice runId="run-abc" onRetry={onRetry} />);

    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_STRUCTURED_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Report issue" })).toHaveAttribute(
      "href",
      expect.stringContaining("runId=run-abc"),
    );
  });
});
