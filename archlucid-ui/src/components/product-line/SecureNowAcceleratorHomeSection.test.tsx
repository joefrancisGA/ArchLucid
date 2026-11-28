import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureNowAcceleratorHomeSection } from "@/components/product-line/SecureNowAcceleratorHomeSection";
import {
  readSecureNowRecentAcceleratorOpens,
  readSecureNowResumeAcceleratorOpen,
  recordSecureNowAcceleratorOpen,
} from "@/lib/product-line/securenow-resume-accelerator-open";

const scope = vi.hoisted(() => ({ tenantId: "home-test-tenant", workspaceId: "home-test-workspace" }));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => scope,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
}));

describe("SecureNowAcceleratorHomeSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not record a recommended shortcut that was not opened", () => {
    const priorVisit = { href: "/administration/securenow-first-hour", label: "First hour" };
    recordSecureNowAcceleratorOpen(scope, priorVisit);

    render(<SecureNowAcceleratorHomeSection />);

    expect(readSecureNowResumeAcceleratorOpen(scope)).toMatchObject(priorVisit);
    expect(readSecureNowRecentAcceleratorOpens(scope).map((row) => row.href)).toEqual([priorVisit.href]);
  });

  it("lists specialty templates and fixture-path-03 quick links", () => {
    render(<SecureNowAcceleratorHomeSection />);

    expect(screen.getByTestId("securenow-accelerator-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-accelerator-home-link-/help/specialty-walkthroughs")).toHaveAttribute(
      "href",
      "/help/specialty-walkthroughs",
    );
    expect(
      screen.getByTestId(
        "securenow-accelerator-home-link-/administration/securenow-scenario-walks#fixture-path-03",
      ),
    ).toHaveAttribute("href", "/administration/securenow-scenario-walks#fixture-path-03");
  });
});
