import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SsoWizardPageClient } from "./_sections/SsoWizardPageClient";

describe("SsoWizardPage", () => {
  it("renders protocol step and advances when protocol selected", async () => {
    const user = userEvent.setup();

    render(<SsoWizardPageClient />);

    expect(screen.getByRole("heading", { name: /SSO configuration wizard/i })).toBeInTheDocument();

    await user.click(screen.getByTestId("sso-protocol-oidc"));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("sso-metadata-url")).toBeInTheDocument();
  });
});
