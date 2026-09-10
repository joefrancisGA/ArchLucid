import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { extendNextNavigationVitestMock } from "@/testing/next-navigation-vitest-mock";

import { TryCliDemoCard } from "./TryCliDemoCard";
import {
  TRY_CLI_DEMO_CLI_HELP_HREF,
  TRY_CLI_DEMO_CLI_HELP_LABEL,
  buildTryCliDemoCommand,
} from "./try-cli-demo-copy";

vi.mock("next/navigation", async (importOriginal) => extendNextNavigationVitestMock(importOriginal));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("TryCliDemoCard", () => {
  it("keeps localhost CLI command out of the first viewport until disclosure opens", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", "https://api.example.test");

    render(<TryCliDemoCard />);

    expect(screen.getByRole("link", { name: "Preview in browser" })).toBeVisible();
    expect(screen.getByRole("link", { name: TRY_CLI_DEMO_CLI_HELP_LABEL })).toHaveAttribute(
      "href",
      TRY_CLI_DEMO_CLI_HELP_HREF,
    );
    expect(screen.getByTestId("try-cli-demo-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-command")).not.toBeVisible();
    expect(screen.getByTestId("try-cli-demo-command")).toHaveTextContent(
      buildTryCliDemoCommand("https://api.example.test"),
    );
    expect(screen.queryByText(/localhost/i)).not.toBeInTheDocument();
  });

  it("copies the interpolated CLI command from the disclosure", async () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", "https://api.example.test");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<TryCliDemoCard />);

    fireEvent.click(screen.getByTestId("try-cli-demo-disclosure"));
    fireEvent.click(screen.getByTestId("try-cli-demo-copy-command"));

    expect(writeText).toHaveBeenCalledWith(buildTryCliDemoCommand("https://api.example.test"));
  });
});
