import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { SectionCard } from "@/components/SectionCard";
import { ShortcutHint } from "@/components/ShortcutHint";

expect.extend(toHaveNoViolations);

describe("operator shell components — axe (Vitest)", () => {
  it("SectionCard has no accessibility violations", async () => {
    const { container } = render(
      <SectionCard title="Coverage section">
        <p>Body copy for the section.</p>
      </SectionCard>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ShortcutHint has no accessibility violations", async () => {
    const { container } = render(<ShortcutHint shortcut="Ctrl+K" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
