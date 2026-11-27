import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FIRST_LOGIN_WORKSPACE_HELP_PRIMARY_CONTENT_ID } from "@/lib/help/first-login-workspace-help-page-copy";
import { HelpFirstLoginWorkspaceGuideView } from "./HelpFirstLoginWorkspaceGuideView";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

const entry = {
  slug: "first-login-workspace",
  title: "First login workspace",
  section: "Help topic",
  description: "Guide",
  productLines: ["architecture"],
};

describe("HelpFirstLoginWorkspaceGuideView working mode (HFI)", () => {
  it("renders main skip target", () => {
    render(<HelpFirstLoginWorkspaceGuideView entry={entry as never} />);
    const main = screen.getByTestId("help-first-login-workspace-primary-content");
    expect(main.tagName).toBe("MAIN");
    expect(main).toHaveAttribute("id", FIRST_LOGIN_WORKSPACE_HELP_PRIMARY_CONTENT_ID);
    expect(main).toHaveAttribute("tabIndex", "-1");
  });
});
