import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/StatusTag";
import { StatusPill } from "@/components/StatusPill";
import { METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";

describe("metadata status labels", () => {
  it("renders StatusTag as a noninteractive span without button semantics", () => {
    render(<StatusTag kind="blocked" label="Blocked" />);

    const badge = screen.getByText("Blocked");

    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role", "button");
    expect(badge.className).toContain("cursor-default");
    expect(badge.className).toContain("pointer-events-none");
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
  });

  it("renders StatusPill pipeline labels as noninteractive spans", () => {
    render(<StatusPill status="Ready to finalize" domain="pipeline" />);

    const badge = screen.getByText("Ready to finalize");

    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain(METADATA_STATUS_TAG_SHELL.split(" ")[0]);
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
});
