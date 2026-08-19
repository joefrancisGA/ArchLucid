import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostAuthBootstrapLoadingView } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapLoadingView";
import {
  AUTH_BOOTSTRAP_LOADING_DETAIL,
  AUTH_BOOTSTRAP_PAGE_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";

describe("PostAuthBootstrapLoadingView (TB-1465)", () => {
  it("shows a status region with page title instead of prose-only loading", () => {
    render(<PostAuthBootstrapLoadingView />);

    expect(screen.getByRole("heading", { level: 1, name: AUTH_BOOTSTRAP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-loading-status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(AUTH_BOOTSTRAP_LOADING_DETAIL)).toBeInTheDocument();
    expect(screen.queryByText(/Preparing your ArchLucid workspace/i)).not.toBeInTheDocument();
  });
});

describe("PostAuthBootstrapLoadingView (TB-1466)", () => {
  it("renders structured skeleton placeholders matching bootstrap card width", () => {
    render(<PostAuthBootstrapLoadingView />);

    expect(screen.getByTestId("post-auth-bootstrap-loading-lead-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-loading-skeleton-card")).toBeInTheDocument();
  });
});
