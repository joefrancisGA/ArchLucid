import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateWorkspaceForm } from "@/app/(operator)/auth/bootstrap/CreateWorkspaceForm";
import { CREATE_WORKSPACE_COPY } from "@/lib/auth/create-workspace-schema";

describe("CreateWorkspaceForm (TB-1467)", () => {
  const defaultProps = {
    pending: false,
    errorMessage: null,
    showAccessRequest: false,
    onSubmit: vi.fn(),
    onAccessRequest: vi.fn(),
  };

  it("renders the data region control aligned with copy", () => {
    render(<CreateWorkspaceForm {...defaultProps} />);

    expect(screen.getByLabelText(CREATE_WORKSPACE_COPY.dataRegionLabel)).toBeInTheDocument();
    expect(screen.getByText(CREATE_WORKSPACE_COPY.dataRegionHint)).toBeInTheDocument();
    expect(screen.getByTestId("create-workspace-data-region")).toBeInTheDocument();
  });

  it("does not leave dataRegionLabel orphaned without a wired control", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(operator)/auth/bootstrap/CreateWorkspaceForm.tsx"),
      "utf8",
    );

    expect(source).toContain("CREATE_WORKSPACE_COPY.dataRegionLabel");
    expect(source).toContain('data-testid="create-workspace-data-region"');
    expect(source).toContain("name=\"dataRegion\"");
  });
});
