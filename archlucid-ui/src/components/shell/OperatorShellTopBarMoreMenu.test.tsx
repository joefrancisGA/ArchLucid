import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { OperatorShellTopBarMoreMenu } from "@/components/shell/OperatorShellTopBarMoreMenu";

vi.mock("next/navigation", () => ({ usePathname: () => "/reviews" }));

afterEach(() => window.history.replaceState(null, "", "/"));

it("returns keyboard focus to the trigger when Escape closes the overflow", () => {
  render(<OperatorShellTopBarMoreMenu><button type="button">Theme</button></OperatorShellTopBarMoreMenu>);

  const trigger = screen.getByRole("button", { name: "More shell tools" });
  fireEvent.click(trigger);
  const tool = screen.getByRole("button", { name: "Theme" });
  tool.focus();
  expect(tool).toHaveFocus();

  fireEvent.keyDown(tool, { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  expect(trigger).toHaveFocus();
});
