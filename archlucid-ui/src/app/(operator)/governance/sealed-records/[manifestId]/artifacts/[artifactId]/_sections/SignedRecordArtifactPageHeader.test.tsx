import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { signedRecordArtifactPageSubtitle } from "@/lib/signed-record-artifact-page-copy";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/governance/sealed-records/manifest-1/artifacts/artifact-1",
}));

import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";

describe("SignedRecordArtifactPageHeader", () => {
  it("renders h1, refresh, and last-refreshed metadata", () => {
    refresh.mockReset();

    render(<SignedRecordArtifactPageHeader subtitle={signedRecordArtifactPageSubtitle(false)} />);

    expect(screen.getByTestId("signed-record-artifact-page-title")).toHaveTextContent("Artifact preview");
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("signed-record-artifact-refresh-button"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
