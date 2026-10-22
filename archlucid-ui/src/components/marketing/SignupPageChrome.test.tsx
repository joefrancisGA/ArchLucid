import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SIGNUP_PRIMARY_CONTENT_ID,
  SIGNUP_SKIP_LINK_LABEL,
} from "@/lib/marketing/signup-page-copy";

import { SignupPageChrome } from "./SignupPageChrome";

describe("SignupPageChrome", () => {
  it("renders skip link, hero slot, and primary content wrapper", () => {
    render(
      <SignupPageChrome hero={<div data-testid="signup-hero-stub">Hero</div>}>
        <div data-testid="signup-body-stub">Form stub</div>
      </SignupPageChrome>,
    );

    expect(screen.getByRole("link", { name: SIGNUP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SIGNUP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("signup-hero-stub")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("signup-primary-content");
    const body = screen.getByTestId("signup-body-stub");

    expect(primaryContent).toContainElement(body);
  });
});
