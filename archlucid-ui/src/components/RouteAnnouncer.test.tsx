import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathnameRef = { current: "/" };

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: () => pathnameRef.current,
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { RouteAnnouncer } from "./RouteAnnouncer";

describe("RouteAnnouncer — live region", () => {
  it("uses polite live region", () => {
    render(<RouteAnnouncer />);
    const live = screen.getByTestId("route-announcer");

    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-atomic", "true");
    expect(live).toHaveClass("sr-only");
  });
});

describe("RouteAnnouncer — announces navigation", () => {
  it("updates message when pathname changes", async () => {
    pathnameRef.current = "/";
    const { rerender } = render(<RouteAnnouncer />);

    pathnameRef.current = "/alerts";
    rerender(<RouteAnnouncer />);

    await waitFor(() => {
      expect(screen.getByTestId("route-announcer")).toHaveTextContent("Navigated to Alerts");
    });
  });
});
