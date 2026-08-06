import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignedRecordEvidenceOrientationStrip } from "@/app/(operator)/governance/signed-records/[manifestId]/_sections/SignedRecordEvidenceOrientationStrip";
import {
  SIGNED_RECORD_CANONICAL_PATH_PATTERN,
  SIGNED_RECORD_SOURCES,
} from "@/lib/signed-record-evidence-copy";

describe("SignedRecordEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the signed-record path pattern", () => {
    render(<SignedRecordEvidenceOrientationStrip />);

    expect(screen.getByTestId("signed-record-sources")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    for (const link of SIGNED_RECORD_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      SIGNED_RECORD_SOURCES.some((link) => link.href === SIGNED_RECORD_CANONICAL_PATH_PATTERN),
    ).toBe(false);
  });
});
