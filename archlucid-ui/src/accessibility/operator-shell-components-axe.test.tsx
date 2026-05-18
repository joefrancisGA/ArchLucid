import { act, fireEvent, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";

import { ContextualHelp } from "@/components/ContextualHelp";
import { contextualHelpTriggerAriaLabel } from "@/lib/contextual-help-content";
import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import { SectionCard } from "@/components/SectionCard";
import { ShortcutHint } from "@/components/ShortcutHint";

expect.extend(toHaveNoViolations);

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

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

  it("ContextualHelp has no accessibility violations when closed", async () => {
    const { container } = render(<ContextualHelp helpKey="new-run-wizard" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ContextualHelp has no accessibility violations when the tooltip is open with learn more", async () => {
    const { container, getByLabelText } = render(<ContextualHelp helpKey="commit-manifest" />);

    act(() => {
      fireEvent.click(getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!));
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ContextualHelp (semantic-search) has no accessibility violations when open", async () => {
    const { container, getByLabelText } = render(<ContextualHelp helpKey="semantic-search" />);

    act(() => {
      fireEvent.click(getByLabelText(contextualHelpTriggerAriaLabel("semantic-search")!));
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ContextualHelp (ask-archlucid) has no accessibility violations when open", async () => {
    const { container, getByLabelText } = render(<ContextualHelp helpKey="ask-archlucid" />);

    act(() => {
      fireEvent.click(getByLabelText(contextualHelpTriggerAriaLabel("ask-archlucid")!));
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("HelpSearchPanel has no accessibility violations when open", async () => {
    const { baseElement } = render(
      <HelpSearchPanel open onOpenChange={() => {}} onOpenGuidesPanel={() => {}} />,
    );

    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
