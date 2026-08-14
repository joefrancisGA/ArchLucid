import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorityThemePilotScope } from "@/components/AuthorityThemePilotScope";
import { UI_AUTHORITY_THEME_ATTRIBUTE } from "@/lib/ui-authority-theme";

describe("AuthorityThemePilotScope", () => {
  it("renders charcoal authority attribute on pilot wrapper", () => {
    render(
      <AuthorityThemePilotScope>
        <span>Pilot surface</span>
      </AuthorityThemePilotScope>,
    );

    const scope = screen.getByTestId("authority-theme-pilot-scope");

    expect(scope.getAttribute(UI_AUTHORITY_THEME_ATTRIBUTE)).toBe("charcoal");
    expect(screen.getByText("Pilot surface")).toBeInTheDocument();
  });
});
