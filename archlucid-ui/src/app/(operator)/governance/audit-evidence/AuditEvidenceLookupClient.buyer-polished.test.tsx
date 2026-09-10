import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION,
  AUDIT_EVIDENCE_PRIMARY_CONTENT_ID,
  AUDIT_EVIDENCE_SKIP_LINK_LABEL,
} from "@/lib/audit-evidence-page-copy";
import { AuditEvidenceLookupClient } from "./AuditEvidenceLookupClient";

describe("AuditEvidenceLookupClient buyer-polished chrome", () => {
  it("renders skip link, inventory start panel, disabled primary until ids are present, and sources strip", () => {
    render(<AuditEvidenceLookupClient />);

    expect(screen.getByRole("link", { name: AUDIT_EVIDENCE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUDIT_EVIDENCE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("audit-evidence-inventory-start-panel")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("audit-evidence-assessment-id"), { target: { value: "a" } });
    fireEvent.change(screen.getByTestId("audit-evidence-snapshot-id"), { target: { value: "s" } });
    fireEvent.change(screen.getByTestId("audit-evidence-control-id"), { target: { value: "c" } });

    expect(submit).toBeEnabled();
  });

  it("parses a pasted lineage URL into the identifier fields", () => {
    render(<AuditEvidenceLookupClient />);

    fireEvent.change(screen.getByTestId("audit-evidence-lineage-url"), {
      target: {
        value: "/governance/audit-evidence/assess-1/snapshots/snap-2/controls/ctrl-3",
      },
    });
    fireEvent.blur(screen.getByTestId("audit-evidence-lineage-url"));

    expect(screen.getByTestId("audit-evidence-assessment-id")).toHaveValue("assess-1");
    expect(screen.getByTestId("audit-evidence-snapshot-id")).toHaveValue("snap-2");
    expect(screen.getByTestId("audit-evidence-control-id")).toHaveValue("ctrl-3");
  });
});
