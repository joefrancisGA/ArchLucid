import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/compliance/audit-evidence",
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
  useProductionDeskChrome: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
      <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
    ),
  };
});

import {
  AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION,
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
  AUDIT_EVIDENCE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_SKIP_LINK_LABEL,
} from "@/lib/audit-evidence-page-copy";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { AuditEvidenceLookupClient } from "./AuditEvidenceLookupClient";

const VALID_ASSESSMENT = "11111111-1111-1111-1111-111111111111";
const VALID_SNAPSHOT = "22222222-2222-2222-2222-222222222222";
const VALID_CONTROL = "33333333-3333-3333-3333-333333333333";

describe("AuditEvidenceLookupClient buyer-polished chrome", () => {
  it("renders skip link, scope banner, disabled primary until ids are valid, and sources strip", () => {
    render(<AuditEvidenceLookupClient />);

    expect(screen.getByRole("link", { name: AUDIT_EVIDENCE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUDIT_EVIDENCE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("audit-evidence-browse-inventory-link")).toBeInTheDocument();
    expect(screen.queryByTestId("audit-evidence-inventory-start-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-sources")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lookup-scope-banner")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.getByTestId("audit-evidence-lookup-build-provenance-limitation")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const submit = screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("audit-evidence-assessment-id"), { target: { value: VALID_ASSESSMENT } });
    fireEvent.change(screen.getByTestId("audit-evidence-snapshot-id"), { target: { value: VALID_SNAPSHOT } });
    fireEvent.change(screen.getByTestId("audit-evidence-control-id"), { target: { value: VALID_CONTROL } });

    expect(submit).toBeEnabled();
  });

  it("parses a pasted lineage URL when Apply link is clicked", () => {
    render(<AuditEvidenceLookupClient />);

    fireEvent.change(screen.getByTestId("audit-evidence-lineage-url"), {
      target: {
        value: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION }));

    expect(screen.getByTestId("audit-evidence-assessment-id")).toHaveValue("assess-1");
    expect(screen.getByTestId("audit-evidence-snapshot-id")).toHaveValue("snap-2");
    expect(screen.getByTestId("audit-evidence-control-id")).toHaveValue("ctrl-3");
    expect(screen.getByTestId("audit-evidence-lineage-url-applied-confirmation")).toBeInTheDocument();
  });
});
