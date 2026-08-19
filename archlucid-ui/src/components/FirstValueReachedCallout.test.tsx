import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FirstValueReachedCallout } from "@/components/FirstValueReachedCallout";

const DISMISS_KEY = "archlucid_first_value_callout_dismissed_v1";

describe("FirstValueReachedCallout", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/v1/tenant/trial-status")) {
          return {
            ok: true,
            json: async () => ({
              firstCommitUtc: "2026-06-01T12:00:00Z",
              trialWelcomeRunId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            }),
          };
        }

        return { ok: false, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders deep-link when firstCommitUtc is set", async () => {
    render(<FirstValueReachedCallout />);

    await waitFor(() => {
      expect(screen.getByTestId("first-value-reached-callout")).toBeInTheDocument();
    });

    const link = screen.getByTestId("first-value-reached-open-review");
    expect(link).toHaveAttribute("href", "/architecture/reviews/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("renders nothing when firstCommitUtc is null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ firstCommitUtc: null, trialWelcomeRunId: null }),
      })),
    );

    render(<FirstValueReachedCallout />);

    await waitFor(() => {
      expect(screen.queryByTestId("first-value-reached-callout")).not.toBeInTheDocument();
    });
  });

  it("stays hidden after dismissal", async () => {
    render(<FirstValueReachedCallout />);

    await waitFor(() => {
      expect(screen.getByTestId("first-value-reached-callout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("first-value-reached-dismiss"));
    expect(window.localStorage.getItem(DISMISS_KEY)).toBe("1");

    render(<FirstValueReachedCallout />);
    expect(screen.queryByTestId("first-value-reached-callout")).not.toBeInTheDocument();
  });
});
