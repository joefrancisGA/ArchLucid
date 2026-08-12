import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerCtoDemoTourOverlay } from "@/components/BuyerCtoDemoTourOverlay";
import {
  BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
} from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_CTO_DEMO_COMPARE_HREF } from "@/lib/buyer/buyer-golden-journey-nav";
import { getShowcaseExecutiveHref, getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY } from "@/lib/operator/operator-static-demo";

const replaceMock = vi.fn();
const prefetchMock = vi.fn();

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

const pathnameMock = vi.fn(() => getShowcaseExecutiveHref());

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: () => pathnameMock(),
  useRouter: () => ({ replace: replaceMock, prefetch: prefetchMock }),
  useSearchParams: () => new URLSearchParams(""),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

describe("BuyerCtoDemoTourOverlay", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    prefetchMock.mockReset();
    pathnameMock.mockReturnValue(getShowcaseExecutiveHref());
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY, "1");
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows preflight gate before the tour controls", async () => {
    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-customer-preflight-gate")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("buyer-cto-demo-tour-next")).toBeNull();
  });

  it("renders expanded overlay with back disabled and next to signed manifest on step 1", async () => {
    sessionStorage.setItem("archlucid.buyerCtoDemoTour.preflightAck.v1", "1");

    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByTestId("buyer-cto-demo-tour-back")).toBeDisabled();
    expect(screen.getByTestId("buyer-cto-demo-tour-next")).toHaveAttribute("href", getShowcaseManifestHref());
    expect(screen.getByTestId("buyer-cto-demo-tour-step-indicators")).toBeInTheDocument();
  });

  it("collapses and expands from the minimize control", async () => {
    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay-collapsed")).toBeInTheDocument();
    });
    expect(sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY)).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Expand CTO demo tour" }));

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });
  });

  it("ends the tour and clears active storage", async () => {
    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "End tour" }));

    await waitFor(() => {
      expect(screen.queryByTestId("buyer-cto-demo-tour-overlay")).toBeNull();
    });
    expect(localStorage.getItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY)).toBeNull();
  });

  it("shows compare drift link on evidence trail step", async () => {
    sessionStorage.setItem("archlucid.buyerCtoDemoTour.preflightAck.v1", "1");
    pathnameMock.mockReturnValue(`/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);

    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cto-demo-presenter-layer-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-compare-drift-link")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cto-demo-compare-drift-link")).toHaveAttribute("href", BUYER_CTO_DEMO_COMPARE_HREF);
  });

  it("shows step budget timer only in presenter layer", async () => {
    sessionStorage.setItem("archlucid.buyerCtoDemoTour.preflightAck.v1", "1");

    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("buyer-cto-demo-tour-step-timer")).toBeNull();

    fireEvent.click(screen.getByTestId("cto-demo-presenter-layer-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-step-budget")).toBeInTheDocument();
      expect(screen.getByTestId("buyer-cto-demo-tour-step-timer")).toBeInTheDocument();
    });
  });

  it("enables offline fallback from panic script section", async () => {
    sessionStorage.setItem("archlucid.buyerCtoDemoTour.preflightAck.v1", "1");

    render(<BuyerCtoDemoTourOverlay />);

    await waitFor(() => {
      expect(screen.getByTestId("buyer-cto-demo-tour-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cto-demo-presenter-layer-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("cto-demo-panic-script-section")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cto-demo-panic-enable-btn"));

    expect(localStorage.getItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY)).toBe("1");
    expect(screen.getByText("Offline fallback active")).toBeInTheDocument();
  });
});
