import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TryPage, { metadata } from "@/app/(marketing)/try/page";

describe("TryPage (TB-774, TB-778)", () => {
  it("uses cloud-neutral auth framing in metadata", () => {
    expect(metadata.description).toMatch(/no cloud account setup/i);
    expect(metadata.description).toMatch(/no corporate sign-in required/i);
    expect(metadata.description).not.toMatch(/\bAzure\b/i);
    expect(metadata.description).not.toMatch(/Entra/i);
  });

  it("keeps cloud-neutral auth framing in body copy without Entra-as-default language", () => {
    render(<TryPage />);

    const text = document.body.textContent ?? "";

    expect(text).toMatch(/no cloud account setup/i);
    expect(text).toMatch(/no corporate sign-in required/i);
    expect(text).not.toMatch(/Entra/i);
    expect(screen.getByTestId("try-page-launcher")).toBeInTheDocument();
  });

  it("discloses Azure reference architecture on the sample review body copy (TB-778)", () => {
    render(<TryPage />);

    const text = document.body.textContent ?? "";

    expect(text).toMatch(/Azure reference architecture/i);
    expect(text).toMatch(/fabricated data/i);
  });
});
