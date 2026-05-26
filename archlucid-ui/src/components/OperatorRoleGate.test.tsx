import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

import { OperatorUnauthorizedPageClient } from "@/components/OperatorRoleGate";

describe("OperatorUnauthorizedPageClient", () => {
  it("shows JwtBearer role mapping callout when JWT mode is active", () => {
    render(<OperatorUnauthorizedPageClient />);

    expect(screen.getByTestId("operator-unauthorized-jwt-role-callout")).toBeInTheDocument();
    expect(screen.getByText(/ArchLucidRoles/i)).toBeInTheDocument();
    expect(screen.getByText(/RoleClaimSources/i)).toBeInTheDocument();
  });
});
