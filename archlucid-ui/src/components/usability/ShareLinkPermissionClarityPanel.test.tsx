import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShareLinkPermissionClarityPanel } from "@/components/usability/ShareLinkPermissionClarityPanel";
import {
  SHARE_LINK_PERMISSION_CLARITY_ROWS,
  SHARE_LINK_PERMISSION_CLARITY_TITLE,
} from "@/lib/share-link-permission-clarity";

describe("ShareLinkPermissionClarityPanel (TB-2212)", () => {
  it("renders the permission matrix with stable test ids", () => {
    render(<ShareLinkPermissionClarityPanel />);

    expect(screen.getByTestId("share-link-permission-clarity")).toBeInTheDocument();
    expect(screen.getByText(SHARE_LINK_PERMISSION_CLARITY_TITLE)).toBeInTheDocument();

    for (const row of SHARE_LINK_PERMISSION_CLARITY_ROWS) {
      expect(screen.getByTestId(`share-link-permission-clarity-${row.id}`)).toHaveTextContent(row.label);
      expect(screen.getByTestId(`share-link-permission-clarity-${row.id}`)).toHaveTextContent(row.detail);
    }
  });
});