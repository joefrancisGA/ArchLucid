import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AUTH_BOOTSTRAP_BREADCRUMB_HUB_LABEL,
  AUTH_BOOTSTRAP_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";

import { PostAuthBootstrapBreadcrumb } from "./PostAuthBootstrapBreadcrumb";

describe("PostAuthBootstrapBreadcrumb", () => {
  it("renders Welcome → Set up your workspace trail", () => {
    render(<PostAuthBootstrapBreadcrumb />);

    const breadcrumb = screen.getByTestId("post-auth-bootstrap-breadcrumb");
    expect(breadcrumb).toHaveTextContent(AUTH_BOOTSTRAP_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(AUTH_BOOTSTRAP_BREADCRUMB_TOPIC_TITLE);
  });
});
