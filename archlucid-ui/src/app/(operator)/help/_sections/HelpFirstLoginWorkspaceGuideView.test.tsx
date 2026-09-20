import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpFirstLoginWorkspaceGuideView } from "@/app/(operator)/help/_sections/HelpFirstLoginWorkspaceGuideView";
import { FIRST_LOGIN_WORKSPACE_HELP_TITLE } from "@/lib/first-login-workspace-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpFirstLoginWorkspaceGuideView (LS-015)", () => {
  it("renders first-login workspace sections without Career vocabulary", () => {
    const entry = getProductDocumentationEntry("first-login-workspace");

    if (entry === undefined) {
      throw new Error("Expected first-login-workspace documentation entry.");
    }

    render(<HelpFirstLoginWorkspaceGuideView entry={entry} />);

    expect(screen.getByTestId("help-first-login-workspace-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-login-workspace-page-title")).toHaveTextContent(
      FIRST_LOGIN_WORKSPACE_HELP_TITLE,
    );
    expect(screen.getByTestId("help-first-login-workspace-record-vs-training")).toHaveTextContent(/Record and Practice/);
    expect(screen.queryByText(/Career/i)).toBeNull();
  });
});
