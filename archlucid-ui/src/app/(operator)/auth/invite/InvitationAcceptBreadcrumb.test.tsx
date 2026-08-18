import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_BREADCRUMB_HUB_LABEL,
  AUTH_INVITE_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/auth/auth-invite-page-copy";

import { InvitationAcceptBreadcrumb } from "./InvitationAcceptBreadcrumb";

describe("InvitationAcceptBreadcrumb", () => {
  it("renders Welcome → Accept workspace invitation trail", () => {
    render(<InvitationAcceptBreadcrumb />);

    const breadcrumb = screen.getByTestId("auth-invite-breadcrumb");
    expect(breadcrumb).toHaveTextContent(AUTH_INVITE_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(AUTH_INVITE_BREADCRUMB_TOPIC_TITLE);
  });
});
