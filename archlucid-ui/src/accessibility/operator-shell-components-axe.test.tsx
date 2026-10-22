/** Open panels via {@link contextualHelpTriggerAriaLabel} — never hardcode legacy `more information: {key}` labels. CI: `npm run test:axe-components` (`ui-axe-components` on full workflow_dispatch). */
import { act, fireEvent, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
  redirect: vi.fn(),
}));

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
    const { container } = render(<ContextualHelp helpKey="commit-manifest" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ContextualHelp has no accessibility violations when the tooltip is open with learn more", async () => {
    const { container, getByLabelText } = render(<ContextualHelp helpKey="commit-manifest" />);

    act(() => {
      fireEvent.click(getByLabelText(contextualHelpTriggerAriaLabel("commit-manifest")!));
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("ContextualHelp (governance-gate) has no accessibility violations when open", async () => {
    const { container, getByLabelText } = render(<ContextualHelp helpKey="governance-gate" />);

    act(() => {
      fireEvent.click(getByLabelText(contextualHelpTriggerAriaLabel("governance-gate")!));
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
