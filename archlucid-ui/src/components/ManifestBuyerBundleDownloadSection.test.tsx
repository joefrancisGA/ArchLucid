import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY } from "@/lib/buyer/buyer-polish-copy";

import { ManifestBuyerBundleDownloadSection } from "./ManifestBuyerBundleDownloadSection";

describe("ManifestBuyerBundleDownloadSection", () => {
  it("renders a collapsed disclosure by default", () => {
    render(<ManifestBuyerBundleDownloadSection manifestId="manifest-1" runId="run-1" />);

    const region = screen.getByTestId("manifest-buyer-bundle-download");
    expect(region.tagName).toBe("DETAILS");
    expect(region).toHaveAttribute("id", "manifest-bundle-zip");
    expect(region.querySelector("summary")).toHaveTextContent(BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY);
  });

  it("renders an open card when expanded for a tab panel", () => {
    render(<ManifestBuyerBundleDownloadSection manifestId="manifest-1" runId="run-1" expanded />);

    const region = screen.getByTestId("manifest-buyer-bundle-download");
    expect(region.tagName).not.toBe("DETAILS");
    expect(region).toHaveAttribute("id", "manifest-bundle-zip");
    expect(screen.getByRole("link", { name: "Download finalized review" })).toBeInTheDocument();
  });
});
