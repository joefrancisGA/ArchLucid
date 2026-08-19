import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SIGNUP_BREADCRUMB_HUB_LABEL,
  SIGNUP_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/marketing/signup-page-copy";

import { SignupBreadcrumb } from "./SignupBreadcrumb";

describe("SignupBreadcrumb", () => {
  it("renders Welcome → Start your evaluation trail", () => {
    render(<SignupBreadcrumb />);

    const breadcrumb = screen.getByTestId("signup-breadcrumb");
    expect(breadcrumb).toHaveTextContent(SIGNUP_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(SIGNUP_BREADCRUMB_TOPIC_TITLE);
  });
});
