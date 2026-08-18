import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthCallbackLoadingView } from "@/app/(operator)/auth/callback/AuthCallbackLoadingView";
import {
  AUTH_CALLBACK_LOADING_DETAIL,
  AUTH_CALLBACK_PAGE_TITLE,
} from "@/lib/auth/auth-callback-page-copy";

describe("AuthCallbackLoadingView", () => {
  it("renders the callback page title and loading status", () => {
    render(<AuthCallbackLoadingView />);

    expect(screen.getByTestId("auth-callback-loading")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: AUTH_CALLBACK_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading-skeleton-card")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-loading-status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(AUTH_CALLBACK_LOADING_DETAIL)).toBeInTheDocument();
  });

  it("shows restart sign-in when the slow hint is enabled", () => {
    render(<AuthCallbackLoadingView showSlowHint />);

    expect(screen.getByTestId("auth-callback-restart-sign-in")).toHaveAttribute("href", "/auth/signin");
  });
});
