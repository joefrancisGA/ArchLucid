import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE } from "@/lib/auth-bootstrap-evidence-copy";
import { PostAuthBootstrapClaimOrientationStrip } from "./PostAuthBootstrapClaimOrientationStrip";

describe("PostAuthBootstrapClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PostAuthBootstrapClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("post-auth-bootstrap-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
