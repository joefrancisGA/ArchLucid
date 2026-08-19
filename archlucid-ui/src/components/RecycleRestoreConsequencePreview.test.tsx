import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecycleRestoreConsequencePreview } from "@/components/RecycleRestoreConsequencePreview";
import {
  RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE,
  RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE,
} from "@/lib/recycle-restore-consequence-preview";

describe("RecycleRestoreConsequencePreview (TB-2278)", () => {
  it("renders returns and distinct drafts/packages rows", () => {
    render(<RecycleRestoreConsequencePreview />);

    expect(screen.getByTestId("recycle-restore-consequence-preview")).toBeInTheDocument();
    expect(screen.getByText(RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("recycle-restore-consequence-preview-returns")).toBeInTheDocument();
    expect(
      screen.getByTestId("recycle-restore-consequence-preview-staysDistinctDrafts"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recycle-restore-consequence-preview-staysDistinctPackages"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("recycle-restore-consequence-preview-distinct")).toHaveTextContent(
      RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE,
    );
  });
});
