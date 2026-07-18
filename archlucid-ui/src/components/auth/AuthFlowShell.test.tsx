import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";

describe("AuthFlowShell", () => {
  it("renders children inside a full-width mobile-friendly container", () => {
    render(
      <AuthFlowShell>
        <p>Sign-in content</p>
      </AuthFlowShell>,
    );

    expect(screen.getByText("Sign-in content")).toBeInTheDocument();
    const shell = screen.getByText("Sign-in content").parentElement;
    expect(shell?.className).toMatch(/max-w-\[560px]/);
    expect(shell?.className).toMatch(/px-4/);
    expect(shell?.className).toMatch(/sm:px-6/);
  });
});
