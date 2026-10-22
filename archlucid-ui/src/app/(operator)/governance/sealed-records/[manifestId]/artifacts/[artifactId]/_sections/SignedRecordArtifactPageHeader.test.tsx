import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { signedRecordArtifactPageSubtitle } from "@/lib/signed-record-artifact-page-copy";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";

describe("SignedRecordArtifactPageHeader", () => {
  it("renders h1, refresh, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <SignedRecordArtifactPageHeader
        subtitle={signedRecordArtifactPageSubtitle(false)}
        refreshing={false}
        onRefresh={onRefresh}
        lastRefreshedAt={new Date("2026-07-01T12:00:00.000Z")}
      />,
    );

    expect(screen.getByTestId("signed-record-artifact-page-title")).toHaveTextContent("Artifact preview");
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("signed-record-artifact-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
