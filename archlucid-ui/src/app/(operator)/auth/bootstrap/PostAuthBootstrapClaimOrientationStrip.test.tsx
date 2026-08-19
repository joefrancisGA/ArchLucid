import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE,
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/auth-bootstrap-evidence-copy";

import { PostAuthBootstrapClaimOrientationStrip } from "./PostAuthBootstrapClaimOrientationStrip";

describe("PostAuthBootstrapClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<PostAuthBootstrapClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-claim-discipline").textContent).toContain(
      AUTH_BOOTSTRAP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("post-auth-bootstrap-sources")).toBeInTheDocument();
  });
});
