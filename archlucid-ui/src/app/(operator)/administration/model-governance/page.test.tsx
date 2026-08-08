import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("./_sections/ModelGovernanceSettingsCard", () => ({
  ModelGovernanceSettingsCard: () => <div data-testid="model-governance-settings-card-stub" />,
}));

import ModelGovernanceSettingsPage from "./page";

describe("ModelGovernanceSettingsPage", () => {
  it("renders one page title without Settings back link or duplicate governance heading (TB-1928 / TB-2094)", () => {
    render(<ModelGovernanceSettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "AI and model governance" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "AI and model governance" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "← Settings" })).not.toBeInTheDocument();
    expect(screen.getByTestId("model-governance-settings-card-stub")).toBeInTheDocument();
  });
});
