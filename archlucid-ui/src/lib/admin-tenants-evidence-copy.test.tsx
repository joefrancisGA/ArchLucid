import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { AdminTenantsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  ADMIN_TENANTS_CANONICAL_PATH,
  ADMIN_TENANTS_FOLLOW_UPS_TITLE,
  ADMIN_TENANTS_SOURCES,
  ADMIN_TENANTS_SOURCES_INTRO,
} from "@/lib/admin-tenants-evidence-copy";

describe("admin-tenants-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(ADMIN_TENANTS_CANONICAL_PATH).toBe("/internal/tenants");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<AdminTenantsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("admin-tenants-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_TENANTS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("admin-tenants-sources");

    expectWhereToGoNextFollowUpLinks(within(sources), ADMIN_TENANTS_SOURCES, ADMIN_TENANTS_CANONICAL_PATH);

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${ADMIN_TENANTS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<AdminTenantsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: ADMIN_TENANTS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
