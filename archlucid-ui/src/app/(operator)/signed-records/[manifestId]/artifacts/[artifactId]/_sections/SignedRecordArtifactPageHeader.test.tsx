import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { signedRecordArtifactPageSubtitle } from "@/lib/signed-record-artifact-page-copy";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/signed-records/manifest-1/artifacts/artifact-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SignedRecordArtifactPageHeader } from "@/app/(operator)/signed-records/[manifestId]/artifacts/[artifactId]/_sections/SignedRecordArtifactPageHeader";

describe("SignedRecordArtifactPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata", () => {
    refresh.mockReset();

    render(<SignedRecordArtifactPageHeader subtitle={signedRecordArtifactPageSubtitle(false)} />);

    expect(screen.getByRole("heading", { level: 2, name: "Artifact preview" })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("signed-record-artifact-refresh-button"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
