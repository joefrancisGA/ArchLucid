import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ACCESS_DENIED_FOLLOW_UPS_TITLE } from "@/lib/access-denied-evidence-copy";
import { AccessDeniedClaimOrientationStrip } from "./AccessDeniedClaimOrientationStrip";

describe("AccessDeniedClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<AccessDeniedClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("access-denied-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ACCESS_DENIED_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
