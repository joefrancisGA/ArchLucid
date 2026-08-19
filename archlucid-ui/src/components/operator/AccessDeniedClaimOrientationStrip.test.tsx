import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED_CLAIM_DISCIPLINE,
  ACCESS_DENIED_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/access-denied-evidence-copy";

import { AccessDeniedClaimOrientationStrip } from "./AccessDeniedClaimOrientationStrip";

describe("AccessDeniedClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<AccessDeniedClaimOrientationStrip />);

    expect(screen.getByRole("heading", { level: 2, name: ACCESS_DENIED_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("access-denied-claim-discipline").textContent).toContain(
      ACCESS_DENIED_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("access-denied-sources")).toBeInTheDocument();
  });
});
