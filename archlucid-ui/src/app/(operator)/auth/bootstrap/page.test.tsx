import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PostAuthBootstrapPage, { metadata } from "@/app/(operator)/auth/bootstrap/page";
import {
  AUTH_BOOTSTRAP_PAGE_DESCRIPTION,
  AUTH_BOOTSTRAP_PAGE_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";

vi.mock("@/app/(operator)/auth/bootstrap/PostAuthBootstrapClient", () => ({
  PostAuthBootstrapClient: () => {
    throw new Promise(() => {
      /* suspend so Suspense fallback renders */
    });
  },
}));

describe("PostAuthBootstrapPage (TB-1465)", () => {
  it("exports document metadata for the bootstrap auth step", () => {
    expect(metadata.title).toBe(AUTH_BOOTSTRAP_PAGE_TITLE);
    expect(metadata.description).toBe(AUTH_BOOTSTRAP_PAGE_DESCRIPTION);
  });

  it("wraps the client in Suspense with branded auth-flow loading chrome", () => {
    render(<PostAuthBootstrapPage />);

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-loading")).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-loading-skeleton-card")).toBeInTheDocument();
  });
});
