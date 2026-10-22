import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManifestDetailNextRecordFooter } from "./ManifestDetailNextRecordFooter";

describe("ManifestDetailNextRecordFooter", () => {
  it("renders next record link", () => {
    render(
      <ManifestDetailNextRecordFooter
        target={{
          manifestId: "manifest-2",
          reviewTitle: "Q2 review",
          href: "/governance/sealed-records/manifest-2",
        }}
      />,
    );

    expect(screen.getByTestId("manifest-detail-next-record-footer")).toBeInTheDocument();
    expect(screen.getByTestId("manifest-detail-next-record-action")).toHaveAttribute(
      "href",
      "/governance/sealed-records/manifest-2",
    );
  });
});
