import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyIdButton } from "./CopyIdButton";

describe("CopyIdButton", () => {
  it("invokes clipboard write with trimmed value", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CopyIdButton value="  abc  " aria-label="Copy test id" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy test id" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("abc");
    });
    vi.unstubAllGlobals();
  });
});
