import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScimVsUsersReconciler } from "@/components/ScimVsUsersReconciler";
import {
  SCIM_VS_USERS_COMPACT_LINE,
  SCIM_VS_USERS_HEADING,
  SCIM_VS_USERS_SCIM_LINK,
  SCIM_VS_USERS_USERS_LINK,
  SCIM_VS_USERS_WHY_TWO,
} from "@/lib/scim-vs-users";

describe("ScimVsUsersReconciler (TB-2259)", () => {
  it("renders compact strip on SCIM with peer link to users", () => {
    render(<ScimVsUsersReconciler currentSurfaceId="scim" />);

    const strip = screen.getByTestId("scim-vs-users");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "scim");
    expect(strip.textContent ?? "").toContain(SCIM_VS_USERS_COMPACT_LINE);

    const peer = screen.getByTestId("scim-vs-users-peer-link");
    expect(peer).toHaveTextContent(SCIM_VS_USERS_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_VS_USERS_USERS_LINK.href);
  });

  it("renders compact strip on users with peer link to SCIM", () => {
    render(<ScimVsUsersReconciler currentSurfaceId="users" />);

    expect(screen.getByTestId("scim-vs-users")).toHaveAttribute(
      "data-current-surface",
      "users",
    );

    const peer = screen.getByTestId("scim-vs-users-peer-link");
    expect(peer).toHaveTextContent(SCIM_VS_USERS_SCIM_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_VS_USERS_SCIM_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ScimVsUsersReconciler currentSurfaceId="scim" variant="full" />);

    const strip = screen.getByTestId("scim-vs-users");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SCIM_VS_USERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SCIM_VS_USERS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("scim-vs-users-current")).toHaveTextContent(
      SCIM_VS_USERS_SCIM_LINK.label,
    );
  });
});
