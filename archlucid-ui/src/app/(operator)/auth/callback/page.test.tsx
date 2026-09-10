import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthCallbackPage from "@/app/(operator)/auth/callback/page";
import {
  AUTH_CALLBACK_PAGE_TITLE,
  AUTH_CALLBACK_SKIP_LINK_LABEL,
  AUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/auth/auth-callback-page-copy";

vi.mock("@/app/(operator)/auth/callback/CallbackClient", () => ({
  CallbackClient: () => {
    throw new Promise(() => {
      /* suspend so Suspense fallback renders */
    });
  },
}));

describe("AuthCallbackPage", () => {
  it("wraps the client in Suspense with buyer chrome and loading skeleton", () => {
    render(<AuthCallbackPage />);

    expect(screen.getByRole("link", { name: AUTH_CALLBACK_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTH_CALLBACK_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("auth-callback-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading-skeleton-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("auth-callback-breadcrumb")).not.toBeInTheDocument();
  });
});
