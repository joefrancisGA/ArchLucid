import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { SecureNowSponsorPathPageView } from "@/app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("pathId=fixture-path-01"),
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <div data-testid="sponsor-path-inspect-stub" />,
}));

vi.mock("@/lib/product-line/securenow-pilot-disposition-sync", () => ({
  loadSecureNowPilotDispositionForPath: vi.fn(async () => null),
  persistSecureNowPilotDispositionForPath: vi.fn(async () => ({
    status: "saved",
    tenantAuditRecorded: true,
  })),
}));

describe("SecureNow sponsor path — axe", () => {
  it("has no serious axe violations when a path is selected", async () => {
    const { container } = render(<SecureNowSponsorPathPageView />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
