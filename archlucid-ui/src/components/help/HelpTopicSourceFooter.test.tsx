import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: vi.fn(() => false),
}));

import { HelpTopicSourceFooter } from "@/components/help/HelpTopicSourceFooter";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const mockedInternalShell = vi.mocked(isArchLucidInternalOperatorShellEnv);

describe("HelpTopicSourceFooter", () => {
  afterEach(() => {
    mockedInternalShell.mockReturnValue(false);
  });

  it("hides GitHub source links from standard customer-facing help topics", () => {
    const entry = getProductDocumentationEntry("enterprise-onboarding");

    expect(entry).toBeDefined();

    const { container } = render(<HelpTopicSourceFooter entry={entry!} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("link", { name: /View source documentation on GitHub/i })).toBeNull();
  });

  it("shows GitHub source links only for internal operator shells", () => {
    mockedInternalShell.mockReturnValue(true);

    const entry = getProductDocumentationEntry("enterprise-onboarding");

    expect(entry).toBeDefined();

    render(<HelpTopicSourceFooter entry={entry!} />);

    expect(screen.getByRole("link", { name: /View source documentation on GitHub/i })).toHaveAttribute(
      "href",
      expect.stringContaining("HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"),
    );
  });
});
