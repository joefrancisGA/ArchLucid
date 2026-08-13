import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import {
  PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE,
  PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
  PATH_CHOOSER_CREATE_OBJECT_HEADING,
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
  PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
  PATH_CHOOSER_CREATE_OBJECT_WHY_THREE,
} from "@/lib/vocabulary/path-chooser-create-object-vocabulary";

describe("PathChooserCreateObjectVocabularyRail (TB-2260)", () => {
  it("renders compact strip on path-chooser with peer links to drafts and Start a review", () => {
    render(
      <PathChooserCreateObjectVocabularyRail currentSurfaceId="path-chooser" />,
    );

    const strip = screen.getByTestId("path-chooser-create-object-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "path-chooser");
    expect(strip.textContent ?? "").toContain(PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE);

    const draftsPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-architecture-drafts",
    );
    expect(draftsPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK.label);
    expect(draftsPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK.href);

    const reviewsPeer = screen.getByTestId(
      "path-chooser-create-object-vocabulary-peer-reviews-new",
    );
    expect(reviewsPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK.label);
    expect(reviewsPeer).toHaveAttribute("href", PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK.href);
  });

  it("renders compact strip on drafts with peer links to path-chooser and Start a review", () => {
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
    expect(pathPeer).toHaveTextContent(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK.label);
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
});
