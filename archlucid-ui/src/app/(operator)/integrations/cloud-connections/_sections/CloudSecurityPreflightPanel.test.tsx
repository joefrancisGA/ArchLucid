import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudSecurityPreflightPanel } from "./CloudSecurityPreflightPanel";

describe("CloudSecurityPreflightPanel", () => {
  it("renders a read-only checklist without attestation controls (P0-2)", () => {
    render(<CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("aws")} providerLabel="AWS" />);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/security review is recommended/i)).not.toBeInTheDocument();
    expect(screen.getByText("Read-only scope")).toBeInTheDocument();
  });
});
