import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/governance/audit-evidence",
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => false,
  useProductionDeskChrome: () => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import {
  AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION,
  AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION,
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
} from "@/lib/audit-evidence-page-copy";
import { AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY } from "@/lib/governance/audit-evidence-lookup-identifier-draft";
import { AuditEvidenceLookupClient } from "./AuditEvidenceLookupClient";

const VALID_ASSESSMENT = "11111111-1111-1111-1111-111111111111";
const VALID_SNAPSHOT = "22222222-2222-2222-2222-222222222222";
const VALID_CONTROL = "33333333-3333-3333-3333-333333333333";

describe("AuditEvidenceLookupClient (Working seat)", () => {
  it("WS-COA: persists identifier draft, applies paste with undo, and validates UUID shapes", async () => {
    window.localStorage.removeItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY);
    render(<AuditEvidenceLookupClient />);

    expect(screen.getByTestId("audit-evidence-lookup-scope-banner")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("audit-evidence-lineage-sources")).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lookup-keyboard-affordance")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("audit-evidence-assessment-id"), {
      target: { value: VALID_ASSESSMENT },
    });
    fireEvent.change(screen.getByTestId("audit-evidence-snapshot-id"), {
      target: { value: VALID_SNAPSHOT },
    });
    fireEvent.change(screen.getByTestId("audit-evidence-control-id"), {
      target: { value: "AC-2" },
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY);
      expect(raw).toContain(VALID_ASSESSMENT);
    });

    fireEvent.change(screen.getByTestId("audit-evidence-lineage-url"), {
      target: {
        value: "/compliance/audit-evidence/assess-9/snapshots/snap-9/controls/ctrl-9",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION }));

    expect(screen.getByTestId("audit-evidence-assessment-id")).toHaveValue("assess-9");
    expect(screen.getByTestId("audit-evidence-lineage-paste-live-region")).toHaveTextContent(/applied/i);

    fireEvent.click(screen.getByRole("button", { name: AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION }));
    expect(screen.getByTestId("audit-evidence-control-id")).toHaveValue("AC-2");

    fireEvent.change(screen.getByTestId("audit-evidence-assessment-id"), { target: { value: "bad" } });
    fireEvent.change(screen.getByTestId("audit-evidence-snapshot-id"), { target: { value: VALID_SNAPSHOT } });
    fireEvent.change(screen.getByTestId("audit-evidence-control-id"), { target: { value: VALID_CONTROL } });

    const submit = screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("audit-evidence-assessment-id"), { target: { value: VALID_ASSESSMENT } });
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    expect(pushMock).toHaveBeenCalledWith(
      `/governance/audit-evidence/${VALID_ASSESSMENT}/snapshots/${VALID_SNAPSHOT}/controls/${VALID_CONTROL}`,
    );
  });

  it("shows validation error summary when paste apply fails", () => {
    render(<AuditEvidenceLookupClient />);

    fireEvent.change(screen.getByTestId("audit-evidence-lineage-url"), { target: { value: "not-a-url" } });
    fireEvent.click(screen.getByRole("button", { name: AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION }));

    expect(screen.getByTestId("audit-evidence-lookup-error-summary")).toBeInTheDocument();
  });
});
