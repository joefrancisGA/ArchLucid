import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/hooks/use-localized-product-copy", () => ({
  useLocalizedProductCopy: () => ({
    productLine: "security",
    localize: (text: string) => text,
  }),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/app/(operator)/help/HelpProductGuide", () => ({
  HelpProductGuide: () => <div data-testid="help-product-guide" />,
}));

vi.mock("@/app/(operator)/help/HelpTourTrigger", () => ({
  HelpTourTrigger: () => null,
}));

import { HelpPageView } from "@/app/(operator)/help/HelpPageView";
import {
  HELP_HUB_BUYER_START_HERE_HELPER_SECURENOW,
  HELP_HUB_PAGE_SUBTITLE_SECURENOW,
} from "@/lib/help/help-hub-page-copy";
import { HELP_HUB_CLAIM_DISCIPLINE_SECURENOW } from "@/lib/help/help-hub-evidence-copy";

describe("HelpPageView SecureNow shell", () => {
  it("orients security operators without architecture-review hub copy", () => {
    render(<HelpPageView />);

    expect(screen.getByText(HELP_HUB_PAGE_SUBTITLE_SECURENOW)).toBeInTheDocument();
    expect(screen.getByTestId("help-hub-claim-discipline")).toHaveTextContent(HELP_HUB_CLAIM_DISCIPLINE_SECURENOW);
    expect(screen.getByTestId("help-hub-buyer-start-here-helper")).toHaveTextContent(
      HELP_HUB_BUYER_START_HERE_HELPER_SECURENOW,
    );
    expect(screen.getByTestId("help-hub-intro").textContent).toContain("cloud evidence");
    expect(screen.getByTestId("help-hub-intro").textContent).not.toContain("review workflows");
    expect(screen.queryByRole("link", { name: /how archlucid works/i })).toBeNull();
  });
});
