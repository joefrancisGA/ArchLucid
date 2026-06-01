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
import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";
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

  it("FirstPilotOperatingRail loading shell has no accessibility violations", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/trial-status")) {
        return new Response(JSON.stringify({ firstCommitUtc: null }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/authority/projects/") && url.includes("/runs")) {
        return new Response(JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 40 }), {
          status: 200,
        });
      }

      return originalFetch(input);
    }) as typeof fetch;

    try {
      const { container } = render(<FirstPilotOperatingRail />);

      expect(await axe(container)).toHaveNoViolations();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
