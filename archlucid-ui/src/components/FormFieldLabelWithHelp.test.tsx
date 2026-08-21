import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormFieldLabelWithHelp } from "./FormFieldLabelWithHelp";

describe("FormFieldLabelWithHelp", () => {
  it("pairs the field label with an accessible help trigger", () => {
    render(<FormFieldLabelWithHelp htmlFor="client-app-id" label="Client/App ID" hint="Entra Application (client) ID." />);

    expect(screen.getByText("Client/App ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Client/App ID" })).toBeInTheDocument();
  });
});
