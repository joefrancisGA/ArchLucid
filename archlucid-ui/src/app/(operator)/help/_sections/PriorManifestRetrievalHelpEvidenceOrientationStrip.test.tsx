import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriorManifestRetrievalHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/PriorManifestRetrievalHelpEvidenceOrientationStrip";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";

describe("PriorManifestRetrievalHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking prior-manifest help", () => {
    render(<PriorManifestRetrievalHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("prior-manifest-retrieval-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("prior-manifest-retrieval-help-claim-discipline")).toBeInTheDocument();

    for (const link of PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES.some(
        (link) => link.href === PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
