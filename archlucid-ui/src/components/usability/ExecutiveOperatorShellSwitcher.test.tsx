import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExecutiveOperatorShellSwitcher } from "@/components/usability/ExecutiveOperatorShellSwitcher";
import { PERSONA_SHELL_LABELS } from "@/lib/persona-shell-vocabulary";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("ExecutiveOperatorShellSwitcher", () => {
  it("shows Architect and Executive persona labels", () => {
    render(<ExecutiveOperatorShellSwitcher />);

    expect(screen.getByRole("link", { name: PERSONA_SHELL_LABELS.architect })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: PERSONA_SHELL_LABELS.executive })).toHaveAttribute(
      "href",
      "/executive/dashboard",
    );
    expect(screen.queryByRole("link", { name: "Operator" })).not.toBeInTheDocument();
  });

  it("marks the architect link active on operator home routes", () => {
    render(<ExecutiveOperatorShellSwitcher />);

    expect(screen.getByRole("link", { name: PERSONA_SHELL_LABELS.architect })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: PERSONA_SHELL_LABELS.executive })).not.toHaveAttribute("aria-current");
  });
});
