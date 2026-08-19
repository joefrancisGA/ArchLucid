import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_BREADCRUMB_HUB_LABEL,
  SESSION_EXPIRED_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/session-expired-page-copy";

import { SessionExpiredBreadcrumb } from "./SessionExpiredBreadcrumb";

describe("SessionExpiredBreadcrumb", () => {
  it("renders Welcome → Session expired trail", () => {
    render(<SessionExpiredBreadcrumb />);

    const breadcrumb = screen.getByTestId("session-expired-breadcrumb");
    expect(breadcrumb).toHaveTextContent(SESSION_EXPIRED_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(SESSION_EXPIRED_BREADCRUMB_TOPIC_TITLE);
  });
});
