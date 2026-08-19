import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { PACKAGE_PRINT_CLAIM_DISCIPLINE } from "@/lib/package-print-evidence-copy";
import {
  PACKAGE_PRINT_CLAIM_HEADING,
  PACKAGE_PRINT_PAGE_SUBTITLE_BUYER,
} from "@/lib/package-print-page-copy";
import type { PackagePrintPresentation } from "@/lib/package-print-view";

import { PackagePrintPageView } from "./PackagePrintPageView";

const presentation: PackagePrintPresentation = {
  title: "Payments edge",
  statusLabel: "Finalized",
  statusKind: "approved",
  findingsSummary: "3 findings",
  sponsorSynopsis: "Sponsor synopsis",
  createdUtc: "2026-01-15T12:00:00.000Z",
  runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
};

describe("PackagePrintPageView buyer-polished shell", () => {
  it("renders breadcrumb, buyer subtitle, claim strip, and hides operator instructions", () => {
    render(<PackagePrintPageView presentation={presentation} />);

    expect(screen.getByTestId("package-print-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_PRINT_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-orientation")).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_PRINT_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_PRINT_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("package-print-instructions")).not.toBeInTheDocument();
  });
});
