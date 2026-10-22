import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingsNaturalLanguageFilter } from "@/components/findings/FindingsNaturalLanguageFilter";

describe("FindingsNaturalLanguageFilter (TB-2207)", () => {
  it("renders with findings-nl-filter test id and applies parsed facets", () => {
    const onApply = vi.fn();

    render(<FindingsNaturalLanguageFilter onApply={onApply} />);

    expect(screen.getByTestId("findings-nl-filter")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("findings-nl-filter-input"), {
      target: { value: "open high TLS" },
    });
    fireEvent.click(screen.getByTestId("findings-nl-filter-apply"));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      severity: "high",
      status: "open",
      titleKeywords: ["tls"],
    });
    expect(screen.getByTestId("findings-nl-filter-applied")).toHaveTextContent(/severity high/i);
  });

  it("applies on form submit", () => {
    const onApply = vi.fn();

    render(<FindingsNaturalLanguageFilter onApply={onApply} />);

    fireEvent.change(screen.getByTestId("findings-nl-filter-input"), {
      target: { value: "disposed medium" },
    });
    fireEvent.submit(screen.getByTestId("findings-nl-filter"));

    expect(onApply).toHaveBeenCalledWith({
      severity: "medium",
      status: "disposed",
      titleKeywords: [],
    });
  });
});