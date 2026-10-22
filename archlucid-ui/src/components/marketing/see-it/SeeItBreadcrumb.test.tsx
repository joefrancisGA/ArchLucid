import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeeItBreadcrumb } from "@/components/marketing/see-it/SeeItBreadcrumb";
import { SEE_IT_BREADCRUMB_HUB_PATH } from "@/lib/see-it-page-copy";

describe("SeeItBreadcrumb", () => {
  it("links Welcome and labels the current sample review page", () => {
    render(<SeeItBreadcrumb />);

    expect(screen.getByTestId("see-it-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Welcome" })).toHaveAttribute("href", SEE_IT_BREADCRUMB_HUB_PATH);
    expect(screen.getByText("See a finalized sample review")).toBeInTheDocument();
  });
});
