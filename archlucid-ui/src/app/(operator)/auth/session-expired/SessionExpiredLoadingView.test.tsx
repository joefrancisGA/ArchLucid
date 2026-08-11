import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionExpiredLoadingView } from "@/app/(operator)/auth/session-expired/SessionExpiredLoadingView";
import { SESSION_EXPIRED_LOADING_DETAIL } from "@/lib/auth/session-expired-page-copy";

describe("SessionExpiredLoadingView (TB-1314)", () => {
  it("renders branded loading status with a level-1 heading", () => {
    render(<SessionExpiredLoadingView />);

    expect(screen.getByTestId("session-expired-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Session expired");
    expect(screen.getByText(SESSION_EXPIRED_LOADING_DETAIL)).toBeInTheDocument();
  });
});
