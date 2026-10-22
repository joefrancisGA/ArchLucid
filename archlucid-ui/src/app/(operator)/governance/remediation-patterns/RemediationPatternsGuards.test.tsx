import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemediationPatternsGuards } from "./RemediationPatternsGuards";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/remediation-patterns",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

describe("RemediationPatternsGuards (LW-081)", () => {
  it("does not render a leave dialog when the YAML draft is empty", () => {
    render(<RemediationPatternsGuards yamlDraft="" />);

    expect(screen.queryByTestId("in-app-navigation-guard-dialog")).toBeNull();
  });
});
