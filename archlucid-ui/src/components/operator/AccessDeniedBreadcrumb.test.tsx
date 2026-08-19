import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED_BREADCRUMB_HUB_LABEL,
  ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/access-denied-page-copy";

import { AccessDeniedBreadcrumb } from "./AccessDeniedBreadcrumb";

describe("AccessDeniedBreadcrumb", () => {
  it("renders Welcome → Access denied trail", () => {
    render(<AccessDeniedBreadcrumb />);

    const breadcrumb = screen.getByTestId("access-denied-breadcrumb");
    expect(breadcrumb).toHaveTextContent(ACCESS_DENIED_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE);
  });
});
