import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScimProvisioningEvidenceOrientationStrip } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningEvidenceOrientationStrip";
import {
  SCIM_PROVISIONING_CANONICAL_PATH,
  SCIM_PROVISIONING_SOURCES,
} from "@/lib/scim-provisioning-evidence-copy";

describe("ScimProvisioningEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking SCIM provisioning", () => {
    render(<ScimProvisioningEvidenceOrientationStrip />);

    expect(screen.getByTestId("scim-provisioning-sources")).toBeInTheDocument();
    expect(screen.getByTestId("scim-provisioning-claim-discipline")).toBeInTheDocument();

    for (const link of SCIM_PROVISIONING_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      SCIM_PROVISIONING_SOURCES.some((link) => link.href === SCIM_PROVISIONING_CANONICAL_PATH),
    ).toBe(false);
  });
});
