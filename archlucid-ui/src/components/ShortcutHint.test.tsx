import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShortcutHint } from "./ShortcutHint";

describe("ShortcutHint", () => {
  it("renders a kbd element with the shortcut text", () => {
    render(<ShortcutHint shortcut="Alt+N" />);

    const kbd = screen.getByText("Alt+N");
    expect(kbd.tagName).toBe("KBD");
  });

  it("applies custom className when provided", () => {
    render(<ShortcutHint shortcut="Alt+C" className="my-extra-class" />);

    expect(screen.getByText("Alt+C")).toHaveClass("my-extra-class");
  });
});
