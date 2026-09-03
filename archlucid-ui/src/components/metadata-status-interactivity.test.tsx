import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/StatusTag";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";

describe("metadata status labels", () => {
  it("renders StatusTag as a noninteractive span without button semantics", () => {
    render(<StatusTag kind="blocked" label="Blocked" />);

    const badge = screen.getByText("Blocked");

    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role", "button");
    expect(badge.className).toContain("cursor-default");
    expect(badge.className).toContain("pointer-events-none");
    expect(badge.className).not.toMatch(/\bhover:/);
    expect(screen.queryByRole("button", { name: "Blocked" })).not.toBeInTheDocument();
  });

  it("renders SeverityTag Warning and Info as noninteractive spans", () => {
    render(
      <>
        <SeverityTag severity={null} kind="warning" />
        <SeverityTag severity={null} kind="info" />
      </>,
    );

    const warning = screen.getByText("Warning");
    const info = screen.getByText("Info");

    expect(warning.tagName).toBe("SPAN");
    expect(info.tagName).toBe("SPAN");
    expect(warning.className).toContain("pointer-events-none");
    expect(info.className).toContain("pointer-events-none");
    expect(warning.className).not.toContain("border-rose");
    expect(info.className).not.toContain("border-blue-700");
  });

  it("renders Ready, Needs attention, and Pending pipeline labels as noninteractive metadata", () => {
    render(
      <>
        <StatusTag kind="ready" label="Ready" />
        <StatusTag kind="needs-attention" label="Needs attention" />
        <StatusTag kind="in-progress" label="Pending" />
      </>,
    );

    for (const label of ["Ready", "Needs attention", "Pending"]) {
      const badge = screen.getByText(label);

      expect(badge.tagName).toBe("SPAN");
      expect(badge.className).toContain("pointer-events-none");
      expect(badge).not.toHaveAttribute("role", "button");
    }
  });

  it("renders StatusTag Finalized and Sample demo badge as noninteractive spans", () => {
    render(
      <>
        <StatusTag kind="ready" label="Finalized" />
        <DemoDataBadge />
      </>,
    );

    const finalized = screen.getByText("Finalized");

    expect(finalized.tagName).toBe("SPAN");
    expect(finalized.className).toContain(METADATA_STATUS_TAG_SHELL.split(" ")[0]);

    const sample = screen.getByTestId("demo-data-badge");

    expect(sample.tagName).toBe("SPAN");
    expect(sample.className).toContain("pointer-events-none");
  });

  it("keeps action buttons distinct from status metadata", () => {
    render(
      <>
        <StatusTag kind="ready" label="Ready" />
        <Button type="button">Start review</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Start review" })).toBeInTheDocument();
    expect(screen.getByText("Ready").tagName).toBe("SPAN");
  });

  it("renders FilterChip as an interactive button with hover affordance", () => {
    render(<FilterChip onClick={() => undefined}>Filter open</FilterChip>);

    const chip = screen.getByRole("button", { name: "Filter open" });

    expect(chip.tagName).toBe("BUTTON");
    expect(chip.className).toContain("hover:bg-[var(--al-layer-hover)]");
    expect(chip.className).not.toContain("pointer-events-none");
  });
});
