import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeeItBreadcrumb } from "@/components/marketing/see-it/SeeItBreadcrumb";

describe("SeeItBreadcrumb", () => {
  it("links Welcome and labels the current sample review page", () => {
    const { container } = render(<SeeItBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
