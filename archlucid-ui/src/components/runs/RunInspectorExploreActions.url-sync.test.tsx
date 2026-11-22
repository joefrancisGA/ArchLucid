import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { RunInspectorExploreActions } from "@/components/runs/RunInspectorExploreActions";
import type { RunSummary } from "@/types/authority";

vi.mock("next/navigation", () => ({ usePathname: () => "/runs" }));

afterEach(() => window.history.replaceState(null, "", "/"));

it.each([
  ["runInspectorRelatedActionsOpen", "Related actions"],
  ["runInspectorOpenArtifactOpen", "Open specific artifact"],
])("restores %s and honors an actual close", (queryParam, summary) => {
  window.history.replaceState(null, "", `/runs?${queryParam}=1`);
  const href = "/runs";
  render(
    <RunInspectorExploreActions
      run={{ runId: "run-1" } as RunSummary}
      buyerPolished
      buyerSafePrimary={false}
      showcaseStory={false}
      showcaseUseWorkspaceQuickLinks={false}
      primaryExplore={{ href, label: "Explore" }}
      signedManifestExplore={{ href, label: "Manifest" }}
      workspaceHref={href}
      showcaseWalkthroughHref={href}
      graphEvidenceHref={href}
      compareHref={href}
      replayHref={href}
      manifestHref={href}
      findingHref={href}
      hasFindingsLink={false}
      hasArtifactsLink={false}
      showEvidenceGraphCta={false}
      findingsQuickHref={href}
      artifactsQuickHref={href}
      timelineQuickHref={href}
      findingsQuickLabel="Findings"
      timelineQuickLabel="Timeline"
      moreOpen={false}
      onToggleMoreOpen={vi.fn()}
    />,
  );

  const details = screen.getByText(summary, { selector: "summary" }).closest("details")!;
  expect(details.open).toBe(true);
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(true);
  expect(new URLSearchParams(window.location.search).get(queryParam)).toBe("1");

  details.open = false;
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(false);
  expect(new URLSearchParams(window.location.search).has(queryParam)).toBe(false);
});
