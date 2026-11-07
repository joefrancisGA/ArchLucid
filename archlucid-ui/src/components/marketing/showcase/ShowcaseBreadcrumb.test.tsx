import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShowcaseBreadcrumb } from "@/components/marketing/showcase/ShowcaseBreadcrumb";
import { SHOWCASE_BREADCRUMB_HUB_PATH } from "@/lib/showcase-page-copy";

describe("ShowcaseBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<ShowcaseBreadcrumb />);

    expect(screen.queryByTestId("showcase-breadcrumb")).not.toBeInTheDocument();
    expect(SHOWCASE_BREADCRUMB_HUB_PATH.length).toBeGreaterThan(0);
  });
});
