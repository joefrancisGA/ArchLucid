import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageShareWhenToSharePreview } from "@/components/ReviewPackageShareWhenToSharePreview";
import { REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE } from "@/lib/review-package-share-when-to-share";

describe("ReviewPackageShareWhenToSharePreview (TB-2243)", () => {
  it("renders share link, print, and export occasion rows", () => {
    render(<ReviewPackageShareWhenToSharePreview />);

    expect(screen.getByTestId("review-package-share-when-to-share")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("review-package-share-when-to-share-shareLink")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-share-when-to-share-print")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-share-when-to-share-export")).toBeInTheDocument();
  });
});
