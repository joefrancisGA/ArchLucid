import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/TryCliDemoCard", () => ({
  TryCliDemoCard: () => <div data-testid="try-cli-demo-card-stub" />,
}));

import DeveloperSettingsPage from "./page";

describe("DeveloperSettingsPage", () => {
  it("renders TryCliDemoCard on the settings developer route", () => {
    render(<DeveloperSettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Developer tools" })).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-card-stub")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Settings" })).toHaveAttribute("href", "/settings");
  });
});
