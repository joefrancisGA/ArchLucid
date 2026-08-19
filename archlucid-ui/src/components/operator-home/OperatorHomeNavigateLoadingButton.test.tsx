import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useTransition: () => [false, (callback: () => void) => callback()] as const,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
  usePathname: () => "/",
}));

import {
  OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS,
  OperatorHomeNavigateLoadingButton,
} from "./OperatorHomeNavigateLoadingButton";

describe("OperatorHomeNavigateLoadingButton", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
    assign.mockReset();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      origin: "http://localhost",
      assign,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("hard-navigates when soft navigation stalls on the home CTA", async () => {
    render(
      <OperatorHomeNavigateLoadingButton
        href="/integrations/cloud-connections"
        idleLabel="Have cloud evidence? Connect…"
        loadingLabel="Opening cloud connections…"
        data-testid="operator-home-connect-cloud"
      />,
    );

    fireEvent.click(screen.getByTestId("operator-home-connect-cloud"));

    expect(screen.getByTestId("operator-home-connect-cloud")).toHaveAttribute("data-loading", "true");
    expect(screen.getByText("Opening cloud connections…")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(OPERATOR_HOME_NAVIGATE_LOADING_TIMEOUT_MS);
    });

    expect(assign).toHaveBeenCalledWith("/integrations/cloud-connections");
    expect(screen.getByTestId("operator-home-connect-cloud")).toHaveAttribute("data-loading", "false");
    expect(screen.getByText("Have cloud evidence? Connect…")).toBeInTheDocument();
  });
});
