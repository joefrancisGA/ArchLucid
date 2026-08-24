import { describe, expect, it } from "vitest";

import {
  PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE,
  PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
  PATH_CHOOSER_CREATE_OBJECT_HEADING,
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
  PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
  PATH_CHOOSER_CREATE_OBJECT_WHY_THREE,
  buildPathChooserCreateObjectVocabulary,
  buildPathChooserCreateObjectVocabularyRailLinks,
  resolvePathChooserCreateObjectLink,
  resolvePathChooserCreateObjectPeerLinks,
} from "@/lib/vocabulary/path-chooser-create-object-vocabulary";
import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";

describe("path-chooser-create-object-vocabulary (TB-2260)", () => {
  it("explains the path-chooser / drafts / Start a review triad and deep-links all three", () => {
    const model = buildPathChooserCreateObjectVocabulary();

    expect(model.heading).toBe(PATH_CHOOSER_CREATE_OBJECT_HEADING);
    expect(model.whyThree).toBe(PATH_CHOOSER_CREATE_OBJECT_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("draft");
    expect(model.whyThree.toLowerCase()).toContain("review");
    expect(model.whyThree.toLowerCase()).toContain("next step");
    expect(model.compactLine).toBe(PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE);

    expect(model.pathChooserLink).toEqual(PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK);
    expect(model.pathChooserLink.href).toBe(PATH_CHOOSER_HELP_PATH);
    expect(model.pathChooserLink.href).toBe("/help/choose-your-next-step");

    expect(model.draftsLink).toEqual(PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK);
    expect(model.draftsLink.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(model.draftsLink.href).toBe("/architecture/architectures");

    expect(model.reviewsNewLink).toEqual(PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK);
    expect(model.reviewsNewLink.href).toBe(REVIEWS_NEW_PATH);
    expect(model.reviewsNewLink.href).toBe("/architecture/reviews/new");
  });

  it("resolves current and peer links for each surface", () => {
    expect(resolvePathChooserCreateObjectLink("path-chooser")).toEqual(
      PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
    );
    expect(resolvePathChooserCreateObjectLink("architecture-drafts")).toEqual(
      PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
    );
    expect(resolvePathChooserCreateObjectLink("reviews-new")).toEqual(
      PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
    );

    expect(resolvePathChooserCreateObjectPeerLinks("path-chooser")).toEqual([
      PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
      PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
    ]);
    expect(resolvePathChooserCreateObjectPeerLinks("architecture-drafts")).toEqual([
      PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
      PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
    ]);
    expect(resolvePathChooserCreateObjectPeerLinks("reviews-new")).toEqual([
      PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
      PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
    ]);
  });

  it("builds compact rail links with inline anchors and a path-chooser tooltip", () => {
    const links = buildPathChooserCreateObjectVocabularyRailLinks("reviews-new");

    expect(links).toHaveLength(2);
    expect(links[0]?.testIdSuffix).toBe("peer-path-chooser");
    expect(links[0]?.compactLineAnchor).toBe("Path chooser");
    expect(links[0]?.tooltip).toContain("product area");
    expect(links[1]?.testIdSuffix).toBe("peer-architecture-drafts");
    expect(links[1]?.compactLineAnchor).toBe("drafts");
    expect(links[1]?.tooltip).toBeUndefined();
  });
});
