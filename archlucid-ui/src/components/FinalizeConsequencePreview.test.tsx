import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinalizeConsequencePreview } from "@/components/FinalizeConsequencePreview";
import {
  FINALIZE_CONSEQUENCE_PREVIEW_TITLE,
  FINALIZE_REPLAY_COMPARE_NOTE,
} from "@/lib/finalize-consequence-preview";

describe("FinalizeConsequencePreview (TB-2224)", () => {
  it("renders locks, editable, and exports unlock rows", () => {
    render(<FinalizeConsequencePreview />);

    expect(screen.getByTestId("finalize-consequence-preview")).toBeInTheDocument();
    expect(screen.getByText(FINALIZE_CONSEQUENCE_PREVIEW_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("finalize-consequence-preview-locks")).toBeInTheDocument();
    expect(screen.getByTestId("finalize-consequence-preview-staysEditable")).toBeInTheDocument();
    expect(screen.getByTestId("finalize-consequence-preview-exportsUnlock")).toBeInTheDocument();
    expect(screen.getByTestId("finalize-consequence-preview-replay")).toHaveTextContent(
      FINALIZE_REPLAY_COMPARE_NOTE,
    );
  });
});
