import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftChangesPagination } from "./DriftChangesPagination";

describe("DriftChangesPagination", () => {
  it("renders the visible range and lets the operator pick a page and page size", () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <DriftChangesPagination
        page={2}
        pageSize={50}
        totalCount={621}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(screen.getByTestId("infra-drift-changes-showing-line")).toHaveTextContent("Showing 51–100 of 621");
    expect(screen.getByTestId("infra-drift-changes-page-select")).toHaveValue("2");
    expect(screen.getByTestId("infra-drift-changes-page-size")).toHaveValue("50");

    fireEvent.change(screen.getByTestId("infra-drift-changes-page-select"), { target: { value: "13" } });
    expect(onPageChange).toHaveBeenCalledWith(13);

    fireEvent.click(screen.getByTestId("infra-drift-changes-previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId("infra-drift-changes-next"));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.change(screen.getByTestId("infra-drift-changes-page-size"), { target: { value: "20" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(20);

    fireEvent.change(screen.getByTestId("infra-drift-changes-page-size"), { target: { value: "100" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it("hides when there are no rows to page", () => {
    const { container } = render(
      <DriftChangesPagination
        page={1}
        pageSize={20}
        totalCount={0}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
