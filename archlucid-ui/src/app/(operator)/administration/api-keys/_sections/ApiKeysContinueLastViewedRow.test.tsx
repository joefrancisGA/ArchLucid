import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysContinueLastViewedRow } from "./ApiKeysContinueLastViewedRow";

describe("ApiKeysContinueLastViewedRow", () => {
  it("renders continue row for last viewed credential", () => {
    render(
      <ApiKeysContinueLastViewedRow
        target={{ slot: "Admin", keyName: "Admin key" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("api-keys-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Admin key")).toBeInTheDocument();
  });
});
