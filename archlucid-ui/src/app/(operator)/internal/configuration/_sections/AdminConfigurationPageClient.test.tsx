import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./use-admin-configuration-page", () => ({
  useAdminConfigurationPage: () => ({
    isDemo: false,
    loadState: "ok",
    lintState: "ok",
    lint: {
      ok: true,
      hostingEnvironmentName: "Development",
      blockingFindings: [],
      advisoryFindings: [],
    },
    search: "",
    setSearch: vi.fn(),
    sectionFilter: "__all__",
    setSectionFilter: vi.fn(),
    sections: [],
    filteredRows: [],
    rowsBySection: [],
    refreshAll: vi.fn(),
  }),
}));

import { AdminConfigurationPageClient } from "@/app/(operator)/internal/configuration/_sections/AdminConfigurationPageClient";

describe("AdminConfigurationPageClient", () => {
  it("renders the evidence orientation strip on the live admin page", () => {
    render(<AdminConfigurationPageClient loaded={{ demo: false }} />);

    expect(screen.getByTestId("admin-configuration-page")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-configuration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-configuration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
