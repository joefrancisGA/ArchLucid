import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SIGNUP_BREADCRUMB_HUB_LABEL,
  SIGNUP_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/signup-page-copy";

import { SignupBreadcrumb } from "./SignupBreadcrumb";

describe("SignupBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<SignupBreadcrumb />);

    expect(screen.queryByTestId("signup-breadcrumb")).not.toBeInTheDocument();
    expect(SIGNUP_BREADCRUMB_HUB_LABEL.length).toBeGreaterThan(0);
    expect(SIGNUP_BREADCRUMB_TOPIC_TITLE.length).toBeGreaterThan(0);
  });
});
