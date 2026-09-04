import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import {
  PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE,
  PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
  PATH_CHOOSER_CREATE_OBJECT_HEADING,
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR,
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_TOOLTIP,
  PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_COMPACT_ANCHOR,
  PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
  PATH_CHOOSER_CREATE_OBJECT_WHY_THREE,
  buildPathChooserCreateObjectVocabularyRailLinks,
} from "@/lib/vocabulary/path-chooser-create-object-vocabulary";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: false,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.isWorkingMode ? "working" : "guided",
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: workspaceModeMock.isWorkingMode,
    setAndPersist: vi.fn(),
  }),
}));

describe("PathChooserCreateObjectVocabularyRail (TB-2260)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
  });
  it("renders compact strip on path-chooser with inline peer links to drafts and Start a review", () => {
    render(
      <PathChooserCreateObjectVocabularyRail currentSurfaceId="path-chooser" />,
    );

    const strip = screen.getByTestId("path-chooser-create-object-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "path-chooser");
    expect(strip.textContent ?? "").toContain(PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE);
    expect(strip.textContent ?? "").not.toContain("·");

    const draftsPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-architecture-drafts",
    );
    expect(draftsPeer).toHaveTextContent("drafts");
    expect(draftsPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK.href);

    const reviewsPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-reviews-new",
    );
    expect(reviewsPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_COMPACT_ANCHOR);
    expect(reviewsPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK.href);
  });

  it("inlines Path chooser with a help tooltip on Start review", () => {
    render(<PathChooserCreateObjectVocabularyRail currentSurfaceId="reviews-new" />);

    const pathChooserPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-path-chooser",
    );
    expect(pathChooserPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR);
    expect(pathChooserPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK.href);
    expect(pathChooserPeer.className).toContain("border-dotted");

    const railLinks = buildPathChooserCreateObjectVocabularyRailLinks("reviews-new");
    const pathChooserLink = railLinks.find((link) => link.testIdSuffix === "peer-path-chooser");
    expect(pathChooserLink?.tooltip).toBe(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_TOOLTIP);
  });

  it("renders compact strip on drafts with inline peer links to path-chooser and Start a review", () => {
    render(
      <PathChooserCreateObjectVocabularyRail currentSurfaceId="architecture-drafts" />,
    );

    expect(screen.getByTestId("path-chooser-create-object-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "architecture-drafts",
    );

    const pathPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-path-chooser",
    );
    expect(pathPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR);
    expect(pathPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK.href);
  });

  it("renders full variant with why-three and triad cards", () => {
    render(
      <PathChooserCreateObjectVocabularyRail
        currentSurfaceId="path-chooser"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("path-chooser-create-object-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(PATH_CHOOSER_CREATE_OBJECT_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PATH_CHOOSER_CREATE_OBJECT_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("path-chooser-create-object-vocabulary-job-path-chooser"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("path-chooser-create-object-vocabulary-job-architecture-drafts"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("path-chooser-create-object-vocabulary-job-reviews-new"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("path-chooser-create-object-vocabulary-current"),
    ).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK.label);
  });

  it("uses the draft editor href for Working-mode Start review peers (WA-02)", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<PathChooserCreateObjectVocabularyRail currentSurfaceId="path-chooser" />);

    const reviewsPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-reviews-new",
    );

    expect(reviewsPeer).toHaveTextContent("New review");
    expect(reviewsPeer).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
  });
});
