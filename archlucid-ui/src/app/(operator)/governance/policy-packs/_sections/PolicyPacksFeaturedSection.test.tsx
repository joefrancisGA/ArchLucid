import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksFeaturedSection } from "./PolicyPacksFeaturedSection";

describe("PolicyPacksFeaturedSection", () => {
  it("links to the existing authoring path with the organization starter selected", () => {
    render(<PolicyPacksFeaturedSection items={[]} />);

    const startLink = screen.getByTestId("policy-packs-start-organization-pack");

    expect(startLink).toHaveAttribute(
      "href",
      "/governance/policy-packs?tab=author&inputMode=visual&generatorTemplate=organization-security-architecture-starter",
    );
  });
});
