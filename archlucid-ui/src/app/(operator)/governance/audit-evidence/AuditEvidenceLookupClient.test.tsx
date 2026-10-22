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
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
  ),
}));

import {
  AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION,
  AUDIT_EVIDENCE_LINEAGE_URL_LABEL,
  AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION,
  AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT,
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
} from "@/lib/audit-evidence-page-copy";
import { AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY } from "@/lib/governance/audit-evidence-lookup-identifier-draft";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { AuditEvidenceLookupClient } from "./AuditEvidenceLookupClient";

const VALID_ASSESSMENT = "11111111-1111-1111-1111-111111111111";
const VALID_SNAPSHOT = "22222222-2222-2222-2222-222222222222";
const VALID_CONTROL = "33333333-3333-3333-3333-333333333333";

describe("AuditEvidenceLookupClient (Working seat)", () => {
  it("renders exactly one h1, short help trigger, scope chip, and Ctrl+Enter affordance", () => {
    render(<AuditEvidenceLookupClient />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("audit-evidence-lookup-scope-chip")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lookup-change-scope-link")).toBeInTheDocument();
    expect(screen.getAllByText(AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("audit-evidence-inventory-start-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-browse-inventory-link")).toBeInTheDocument();
  });

  it("WS-COA: persists identifier draft, applies paste with undo, and validates UUID shapes", async () => {
    window.localStorage.removeItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY);
    render(<AuditEvidenceLookupClient />);

    expect(screen.getByTestId("audit-evidence-lookup-scope-banner")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("audit-evidence-lineage-sources")).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lookup-keyboard-affordance")).toBeInTheDocument();
    expect(screen.getByLabelText(AUDIT_EVIDENCE_LINEAGE_URL_LABEL)).toBeInTheDocument();

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
    expect(screen.getByTestId("audit-evidence-lineage-url-applied-confirmation")).toHaveTextContent(
      /Filled Assessment ID/i,
    );

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

  it("shows malformed assessment error on blur without submit and re-enables after fix", () => {
    render(<AuditEvidenceLookupClient />);

    const assessmentInput = screen.getByTestId("audit-evidence-assessment-id");
    fireEvent.change(assessmentInput, { target: { value: "bad" } });
    fireEvent.blur(assessmentInput);

    expect(assessmentInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("audit-evidence-open-readiness")).toHaveTextContent(/Assessment ID/i);
    expect(screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION })).toBeDisabled();

    fireEvent.change(assessmentInput, { target: { value: VALID_ASSESSMENT } });
    fireEvent.change(screen.getByTestId("audit-evidence-snapshot-id"), { target: { value: VALID_SNAPSHOT } });
    fireEvent.change(screen.getByTestId("audit-evidence-control-id"), { target: { value: VALID_CONTROL } });

    expect(screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION })).toBeEnabled();
  });

  it("applies lineage URL on Enter and opens on second Enter when identifiers are valid", () => {
    render(<AuditEvidenceLookupClient />);

    const lineageUrlInput = screen.getByTestId("audit-evidence-lineage-url");
    fireEvent.change(lineageUrlInput, {
      target: {
        value: `/governance/audit-evidence/${VALID_ASSESSMENT}/snapshots/${VALID_SNAPSHOT}/controls/${VALID_CONTROL}`,
      },
    });
    fireEvent.submit(lineageUrlInput.closest("form") as HTMLFormElement);

    expect(screen.getByTestId("audit-evidence-assessment-id")).toHaveValue(VALID_ASSESSMENT);

    const openButton = screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION });
    expect(openButton).toBeEnabled();
    fireEvent.click(openButton);

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

  it("lists recent lineage visits and fills lookup fields from a row", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
            label: "AC-2",
            kind: "page",
            visitedAtUtc: "2026-09-01T12:00:00Z",
          },
        ],
      }),
    );

    render(<AuditEvidenceLookupClient />);

    expect(screen.getByTestId("audit-evidence-lookup-recent-lineage-table")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("audit-evidence-lookup-recent-lineage-fill"));

    expect(screen.getByTestId("audit-evidence-assessment-id")).toHaveValue("assess-1");
    expect(screen.getByTestId("audit-evidence-snapshot-id")).toHaveValue("snap-2");
    expect(screen.getByTestId("audit-evidence-control-id")).toHaveValue("ctrl-3");
  });
});
