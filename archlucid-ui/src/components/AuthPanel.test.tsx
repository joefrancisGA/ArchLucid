import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

import { AuthPanel } from "./AuthPanel";

describe("AuthPanel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not render a duplicate sample workspace badge in development bypass mode", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(<AuthPanel />);

    expect(screen.queryByText("Sample workspace")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Environment mode")).not.toBeInTheDocument();
  });
});
