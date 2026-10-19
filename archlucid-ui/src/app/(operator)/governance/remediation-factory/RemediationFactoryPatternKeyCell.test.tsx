import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemediationFactoryPatternKeyCell } from "./RemediationFactoryPatternKeyCell";

describe("RemediationFactoryPatternKeyCell", () => {
  it("shows Pattern and reveals the key behind Show identifiers", () => {
    render(
      <RemediationFactoryPatternKeyCell
        findingId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        patternKey="storage.encrypt"
      />,
    );

    expect(screen.getByRole("link", { name: "Pattern" })).toHaveAttribute(
      "href",
      "/insights/patterns/storage.encrypt",
    );
    expect(screen.queryByText("storage.encrypt")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remediation-priority-pattern-identifiers-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

    expect(screen.getByTestId("remediation-priority-pattern-key-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toHaveTextContent(
      "storage.encrypt",
    );
  });

  it("shows the empty label when patternKey is missing", () => {
    render(
      <RemediationFactoryPatternKeyCell
        findingId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        patternKey={null}
        emptyLabel="Name not recorded"
      />,
    );

    expect(screen.getByText("Name not recorded")).toBeInTheDocument();
    expect(screen.queryByText("Pattern")).not.toBeInTheDocument();
  });
});
