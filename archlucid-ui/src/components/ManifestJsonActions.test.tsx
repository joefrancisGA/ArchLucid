import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManifestJsonActions } from "@/components/ManifestJsonActions";

vi.mock("@/components/DownloadManifestButton", () => ({
  DownloadManifestButton: () => <button type="button">Download</button>,
}));

vi.mock("@/components/CopyManifestButton", () => ({
  CopyManifestButton: () => <button type="button">Copy</button>,
}));

describe("ManifestJsonActions", () => {
  it("renders download and copy actions", () => {
    render(<ManifestJsonActions runId="run-123" />);

    expect(screen.getByTestId("manifest-json-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
