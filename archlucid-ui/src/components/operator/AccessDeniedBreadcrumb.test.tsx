import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED_BREADCRUMB_HUB_LABEL,
  ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/access-denied-page-copy";

import { AccessDeniedBreadcrumb } from "./AccessDeniedBreadcrumb";

describe("AccessDeniedBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<AccessDeniedBreadcrumb />);

    expect(screen.queryByTestId("access-denied-breadcrumb")).not.toBeInTheDocument();
    expect(ACCESS_DENIED_BREADCRUMB_HUB_LABEL.length).toBeGreaterThan(0);
    expect(ACCESS_DENIED_BREADCRUMB_TOPIC_TITLE.length).toBeGreaterThan(0);
  });
});
