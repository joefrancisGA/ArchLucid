import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthCallbackPage from "@/app/(operator)/auth/callback/page";
import { AUTH_CALLBACK_PAGE_TITLE } from "@/lib/auth/auth-callback-page-copy";

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

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading-skeleton-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
  });
});
