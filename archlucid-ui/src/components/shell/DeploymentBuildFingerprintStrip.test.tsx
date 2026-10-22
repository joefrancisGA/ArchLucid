import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeploymentBuildFingerprintStrip } from "./DeploymentBuildFingerprintStrip";

describe("DeploymentBuildFingerprintStrip", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the compact CI build mark when the number is baked in", () => {
    vi.stubEnv("NEXT_PUBLIC_CI_BUILD_NUMBER", "1842");

    render(<DeploymentBuildFingerprintStrip variant="compact" />);

    expect(screen.getByTestId("deployment-build-fingerprint")).toHaveTextContent("Build 1842");
  });

  it("hides the compact mark when the CI number is not baked in", () => {
    vi.stubEnv("NEXT_PUBLIC_CI_BUILD_NUMBER", "");

    const { container } = render(<DeploymentBuildFingerprintStrip variant="compact" />);

    expect(screen.queryByTestId("deployment-build-fingerprint")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("includes the CI build number on the full operator fingerprint line", () => {
    vi.stubEnv("NEXT_PUBLIC_CI_BUILD_NUMBER", "1842");
    vi.stubEnv("NEXT_PUBLIC_BUILD_COMMIT_SHA", "abcdef1234567890abcdef1234567890abcdef12");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIMESTAMP", "2026-07-03T12:00:00Z");
    vi.stubEnv("NEXT_PUBLIC_DEPLOY_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_API_UPSTREAM_HOST", "api.example.com");

    render(<DeploymentBuildFingerprintStrip />);

    expect(screen.getByTestId("deployment-build-fingerprint")).toHaveTextContent(
      "Build 1842 · UI build abcdef123456 · 2026-07-03T12:00:00Z · env staging · API api.example.com",
    );
  });
});
