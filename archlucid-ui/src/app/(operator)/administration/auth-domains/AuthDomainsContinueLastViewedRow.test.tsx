import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthDomainsContinueLastViewedRow } from "./AuthDomainsContinueLastViewedRow";

describe("AuthDomainsContinueLastViewedRow", () => {
  it("renders continue row for last viewed domain", () => {
    render(
      <AuthDomainsContinueLastViewedRow
        target={{ normalizedDomain: "example.com", displayDomain: "example.com" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("auth-domains-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });
});
