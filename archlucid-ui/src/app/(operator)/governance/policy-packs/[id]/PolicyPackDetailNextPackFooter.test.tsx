import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackDetailNextPackFooter } from "./PolicyPackDetailNextPackFooter";

describe("PolicyPackDetailNextPackFooter", () => {
  it("renders next pack link", () => {
    render(
      <PolicyPackDetailNextPackFooter
        target={{
          policyPackId: "pack-2",
          name: "Healthcare baseline",
          href: "/governance/policy-packs?packId=pack-2",
        }}
      />,
    );

    expect(screen.getByTestId("policy-pack-detail-next-pack-footer")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-next-pack-action")).toHaveAttribute(
      "href",
      "/governance/policy-packs?packId=pack-2",
    );
  });
});
