import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudConnectionsContinueLastViewedRow } from "./CloudConnectionsContinueLastViewedRow";

describe("CloudConnectionsContinueLastViewedRow", () => {
  it("renders continue row for last viewed cloud provider", () => {
    render(
      <CloudConnectionsContinueLastViewedRow
        target={{
          provider: "aws",
          name: "AWS",
          href: "/integrations/cloud-connections/aws",
        }}
      />,
    );

    expect(screen.getByTestId("cloud-connections-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });
});
