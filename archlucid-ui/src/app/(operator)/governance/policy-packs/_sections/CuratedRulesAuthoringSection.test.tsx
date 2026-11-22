import { fireEvent, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createEmptyCuratedRuleRow, createEmptyCuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";

import { CuratedRulesAuthoringSection } from "./CuratedRulesAuthoringSection";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("tab=author&packId=pack-1&curatedRuleEdit=rule-1"),
}));

vi.mock("@/lib/product-line/use-policy-packs-hub-path", () => ({
  usePolicyPacksHubPath: () => "/governance/policy-packs",
}));

describe("CuratedRulesAuthoringSection", () => {
  it("clears the dialog URL once when cancelling a rule edit", () => {
    const curatedDoc = {
      ...createEmptyCuratedRulesDocument({}),
      rules: [{ ...createEmptyCuratedRuleRow(), id: "rule-1", title: "Example rule" }],
    };

    render(
      <StrictMode>
        <CuratedRulesAuthoringSection
          canMutatePacks
          curatedDoc={curatedDoc}
          onCuratedDocChange={vi.fn()}
          packName="Example pack"
          packDescription=""
          publishVersion="1.0.0"
          packType="ProjectCustom"
        />
      </StrictMode>,
    );

    const dialog = screen.getByRole("dialog", { name: "Edit curated rule" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledExactlyOnceWith("/governance/policy-packs?tab=author&packId=pack-1", {
      scroll: false,
    });
  });
});
