import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DigestsBrowseContinueLastViewedRow } from "./DigestsBrowseContinueLastViewedRow";

describe("DigestsBrowseContinueLastViewedRow", () => {
  it("opens the pinned digest when clicked", () => {
    const onOpen = vi.fn();

    render(
      <DigestsBrowseContinueLastViewedRow
        target={{ digestId: "d1", title: "Weekly digest" }}
        onOpen={onOpen}
      />,
    );

    expect(screen.getByTestId("digests-browse-continue-last-viewed-row")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("digests-browse-continue-last-viewed-open"));
    expect(onOpen).toHaveBeenCalledWith("d1");
  });
});
