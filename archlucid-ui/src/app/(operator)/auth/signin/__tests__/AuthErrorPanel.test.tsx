import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthErrorPanel } from "@/app/(operator)/auth/signin/AuthErrorPanel";

describe("AuthErrorPanel", () => {
  it("renders the default title, message, and primary try-again action", () => {
    render(<AuthErrorPanel message="Identity provider is not configured." />);

    expect(screen.getByTestId("auth-error-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access request" })).toBeInTheDocument();
    expect(screen.getByText("Identity provider is not configured.")).toBeInTheDocument();
    expect(screen.getByTestId("auth-error-try-again")).toHaveAttribute("href", "/auth/signin");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  });

  it("supports a custom title for callback failures", () => {
    render(<AuthErrorPanel title="Sign-in could not finish" message="Token exchange failed." />);

    expect(screen.getByRole("heading", { name: "Sign-in could not finish" })).toBeInTheDocument();
  });
});
