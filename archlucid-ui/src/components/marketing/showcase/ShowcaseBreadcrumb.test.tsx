import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShowcaseBreadcrumb } from "@/components/marketing/showcase/ShowcaseBreadcrumb";
import { SHOWCASE_BREADCRUMB_HUB_PATH } from "@/lib/showcase-page-copy";

describe("ShowcaseBreadcrumb", () => {
  it("links See it and labels the current sample showcase page", () => {
    render(<ShowcaseBreadcrumb />);

    expect(screen.getByTestId("showcase-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See a finalized sample review" })).toHaveAttribute(
      "href",
      SHOWCASE_BREADCRUMB_HUB_PATH,
    );
    expect(screen.getByText("Sample showcase")).toBeInTheDocument();
  });
});
