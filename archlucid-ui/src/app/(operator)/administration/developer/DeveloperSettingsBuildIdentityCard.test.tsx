import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeveloperSettingsBuildIdentityCard } from "./DeveloperSettingsBuildIdentityCard";

describe("DeveloperSettingsBuildIdentityCard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("surfaces installed Next.js version and stale node_modules guidance", () => {
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PACKAGE_VERSION", "16.3.5");
    vi.stubEnv("NEXT_PUBLIC_NEXTJS_PINNED_VERSION", "16.3.6");

    render(<DeveloperSettingsBuildIdentityCard />);

    expect(screen.getByTestId("developer-settings-nextjs-version")).toHaveTextContent("16.3.5");
    expect(screen.getByTestId("developer-settings-nextjs-pin-mismatch")).toHaveTextContent(/npm ci/i);
  });
});
