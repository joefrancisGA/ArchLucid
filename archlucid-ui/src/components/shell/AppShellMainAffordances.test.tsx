import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellMainAffordances } from "@/components/shell/AppShellMainAffordances";

const teachingChromeVisibleMock = vi.hoisted(() => ({ value: true }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/workspace-mode/use-teaching-chrome-visible", () => ({
  useTeachingChromeVisible: () => teachingChromeVisibleMock.value,
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  isExplicitStaticDemoMarketingBuild: () => false,
}));

vi.mock("@/lib/persistent-workspace-next-action-strip-path", () => ({
  isPersistentWorkspaceNextActionStripPath: () => false,
}));

vi.mock("@/components/shell/BuyerGoldenJourneyLayerContextStrip", () => ({
  BuyerGoldenJourneyLayerContextStrip: () => <div data-testid="buyer-golden-journey-layer-context-strip" />,
}));

vi.mock("@/components/operator/OperatorRecentViewsTracker", () => ({
  OperatorRecentViewsTracker: () => null,
}));

vi.mock("@/components/usability/ReviewsListReturnStateTracker", () => ({
  ReviewsListReturnStateTracker: () => null,
}));

vi.mock("@/components/usability/PersistentWorkspaceNextActionStrip", () => ({
  PersistentWorkspaceNextActionStrip: () => <div data-testid="persistent-workspace-next-action-strip" />,
}));

vi.mock("@/components/usability/CorePilotCompleteCelebrateStrip", () => ({
  CorePilotCompleteCelebrateStrip: () => <div data-testid="core-pilot-celebrate-strip" />,
}));

vi.mock("@/components/usability/GlobalSearchShortcutCoach", () => ({
  GlobalSearchShortcutCoach: () => <div data-testid="global-search-shortcut-coach" />,
}));

vi.mock("@/components/usability/FirstVisitHelpAutoOpen", () => ({
  FirstVisitHelpAutoOpen: () => <div data-testid="first-visit-help-auto-open" />,
}));

vi.mock("@/components/KeyboardShortcutsDiscoverabilityCoach", () => ({
  KeyboardShortcutsDiscoverabilityCoach: () => <div data-testid="keyboard-shortcuts-coach" />,
}));

vi.mock("@/components/usability/ExplainThisViewBanner", () => ({
  ExplainThisViewBanner: () => <div data-testid="explain-this-view-banner" />,
}));

vi.mock("@/components/ContextualPageHintStrip", () => ({
  ContextualPageHintStrip: () => <div data-testid="contextual-page-hint-strip" />,
}));

vi.mock("@/components/usability/PageContextualHelpFab", () => ({
  PageContextualHelpFab: () => <div data-testid="page-contextual-help-fab" />,
}));

describe("AppShellMainAffordances (LD-15)", () => {
  beforeEach(() => {
    teachingChromeVisibleMock.value = true;
  });

  it("mounts teaching chrome on Guided seats", () => {
    render(<AppShellMainAffordances />);

    expect(screen.getByTestId("first-visit-help-auto-open")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-shortcuts-coach")).toBeInTheDocument();
    expect(screen.getByTestId("explain-this-view-banner")).toBeInTheDocument();
    expect(screen.getByTestId("contextual-page-hint-strip")).toBeInTheDocument();
  });

  it("fails closed in Working mode without auto-open coaches", () => {
    teachingChromeVisibleMock.value = false;

    render(<AppShellMainAffordances />);

    expect(screen.queryByTestId("first-visit-help-auto-open")).toBeNull();
    expect(screen.queryByTestId("keyboard-shortcuts-coach")).toBeNull();
    expect(screen.queryByTestId("global-search-shortcut-coach")).toBeNull();
    expect(screen.queryByTestId("explain-this-view-banner")).toBeNull();
    expect(screen.queryByTestId("contextual-page-hint-strip")).toBeNull();
    expect(screen.queryByTestId("persistent-workspace-next-action-strip")).toBeNull();
    expect(screen.getByTestId("page-contextual-help-fab")).toBeInTheDocument();
  });
});
