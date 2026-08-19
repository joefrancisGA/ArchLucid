import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authModeMock = vi.hoisted(() => ({ AUTH_MODE: "jwt" as string }));
const jwtModeMock = vi.hoisted(() => ({ isJwtAuthMode: vi.fn(() => true) }));
const signedInMock = vi.hoisted(() => ({ isLikelySignedIn: vi.fn(() => false) }));

vi.mock("@/lib/auth-config", () => authModeMock);
vi.mock("@/lib/oidc/config", () => jwtModeMock);
vi.mock("@/lib/oidc/session", () => signedInMock);

import {
  DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
  DemoExplainConversionCtaCard,
} from "@/components/DemoExplainConversionCtaCard";

describe("DemoExplainConversionCtaCard (TB-1323)", () => {
  beforeEach(() => {
    authModeMock.AUTH_MODE = "jwt";
    jwtModeMock.isJwtAuthMode.mockReturnValue(true);
    signedInMock.isLikelySignedIn.mockReturnValue(false);
  });

  it("routes anonymous viewers to sign-in instead of implying in-product wizard access", () => {
    render(<DemoExplainConversionCtaCard />);

    const primary = screen.getByTestId("demo-explain-conversion-primary");
    const fab = screen.getByTestId("demo-explain-conversion-fab");

    expect(screen.getByTestId("demo-explain-conversion-cta")).toHaveAttribute(
      "data-auth-expectation",
      "sign-in-required",
    );
    expect(primary).toHaveTextContent("Sign in to start a review");
    expect(primary.getAttribute("href")).toContain("/auth/signin");
    expect(primary.getAttribute("href")).toContain(
      encodeURIComponent(DEMO_EXPLAIN_CONVERSION_REVIEW_HREF),
    );
    expect(primary.getAttribute("href")).not.toBe(DEMO_EXPLAIN_CONVERSION_REVIEW_HREF);
    expect(fab).toHaveTextContent("Sign in");
    expect(fab.getAttribute("href")).toContain("/auth/signin");
    expect(screen.getByTestId("demo-explain-conversion-see-it")).toHaveAttribute("href", "/see-it");
    expect(screen.queryByText("Start a new review →")).not.toBeInTheDocument();
  });

  it("keeps the wizard preset href for signed-in viewers", () => {
    signedInMock.isLikelySignedIn.mockReturnValue(true);

    render(<DemoExplainConversionCtaCard />);

    expect(screen.getByTestId("demo-explain-conversion-primary")).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
    );
    expect(screen.getByTestId("demo-explain-conversion-fab")).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
    );
    expect(screen.getByTestId("demo-explain-conversion-cta")).toHaveAttribute(
      "data-auth-expectation",
      "signed-in",
    );
    expect(screen.queryByTestId("demo-explain-conversion-see-it")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See what you need first" })).toHaveAttribute(
      "href",
      "/help/choose-your-next-step",
    );
  });
});
