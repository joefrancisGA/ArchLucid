import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TryCliDemoCard } from "./TryCliDemoCard";
import { TRY_CLI_DEMO_COMMAND } from "./try-cli-demo-copy";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("TryCliDemoCard", () => {
  it("keeps localhost CLI command out of the first viewport until disclosure opens", () => {
    render(<TryCliDemoCard />);

    expect(screen.getByRole("link", { name: "Preview in browser" })).toBeVisible();
    expect(screen.getByTestId("try-cli-demo-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("try-cli-demo-command")).not.toBeVisible();
    expect(screen.queryByText(/localhost/i)).not.toBeInTheDocument();
    expect(TRY_CLI_DEMO_COMMAND).not.toContain("localhost");
  });
});
