import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsRolesContinueLastViewedRow } from "./SettingsRolesContinueLastViewedRow";

describe("SettingsRolesContinueLastViewedRow", () => {
  it("renders continue row for last viewed principal", () => {
    render(
      <SettingsRolesContinueLastViewedRow
        target={{ principalId: "u1", kind: "user", name: "Ada Lovelace" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("settings-roles-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
