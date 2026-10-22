import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listRunsByProjectPaged = vi.fn();
const enrichSignedRecordsListRows = vi.fn();
const searchParamsState = { value: "" };

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => new URLSearchParams(searchParamsState.value),
  });
});

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
}));

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    areSpineStaticDemoPayloadsAvailable: () => false,
    tryStaticDemoRunSummariesPaged: () => null,
  };
});

vi.mock("./signed-records-list-deferred-chunks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./signed-records-list-deferred-chunks")>();
  const { SignedRecordsListTable } = await import("./SignedRecordsListTable");

  return {
    ...actual,
    SignedRecordsListTableDeferred: SignedRecordsListTable,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isOperatorExperienceFullShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("./enrich-signed-records-list-rows", () => ({
  enrichSignedRecordsListRows: (...args: unknown[]) => enrichSignedRecordsListRows(...args),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("./SignedRecordsListNextReviewFooterClient", () => ({
  SignedRecordsListNextReviewFooterClient: () => <div data-testid="signed-records-next-review-footer-stub" />,
}));

import SignedRecordsListClient from "./SignedRecordsListClient";
import {
  SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE,
  SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE,
} from "@/lib/signed-records-list-evidence-copy";
import {
  GOVERNANCE_SIGNED_RECORDS_LIST_BUYER_START_HERE_HELPER,
  GOVERNANCE_SIGNED_RECORDS_LIST_PAGE_LEAD,
  GOVERNANCE_SIGNED_RECORDS_LIST_PRIMARY_CONTENT_ID,
  GOVERNANCE_SIGNED_RECORDS_LIST_SKIP_LINK_LABEL,
} from "@/lib/governance-signed-records-list-page-copy";
import { SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER } from "./signed-records-list-page-copy";

import type { RunSummary } from "@/types/authority";

const finalizedRun: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000099",
  projectId: "default",
  description: "Claims modernization",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: false,
  hasFindingsSnapshot: true,
  hasGoldenManifest: true,
};

const enrichedRow = {
  runId: finalizedRun.runId,
  reviewTitle: "Claims modernization",
  committedUtc: "2026-03-20T16:45:00.000Z",
  manifestVersion: "2.4.1",
  manifestId: "manifest-abc",
  reviewHref: `/architecture/reviews/${finalizedRun.runId}`,
  signedRecordHref: "/governance/sealed-records/manifest-abc",
  sealIntegrity: { kind: "ready" as const, label: "Finalized" },
  sealDigestTruncated: "sha256-d…34567890",
  sealDigestFull: "sha256-deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  recordLookupFailure: null,
};

beforeEach(() => {
  searchParamsState.value = "runId=00000000-0000-0000-0000-000000000099";
  listRunsByProjectPaged.mockReset();
  enrichSignedRecordsListRows.mockReset();
});

describe("SignedRecordsListClient buyer-polished shell (SI)", () => {
  it("renders skip link, buyer subtitle, first-viewport intro, and orientation after list body", async () => {
    listRunsByProjectPaged.mockResolvedValue({
      items: [finalizedRun],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    enrichSignedRecordsListRows.mockImplementation(async (rows: readonly { runId: string }[]) =>
      rows.map((row) => ({
        ...enrichedRow,
        runId: row.runId,
        reviewHref: `/architecture/reviews/${row.runId}`,
      })),
    );

    render(<SignedRecordsListClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_SIGNED_RECORDS_LIST_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_SIGNED_RECORDS_LIST_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("signed-records-list-claim-discipline").textContent).toContain(
      SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("governance-signed-records-list-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-signed-records-list-intro")).toHaveTextContent(
      GOVERNANCE_SIGNED_RECORDS_LIST_PAGE_LEAD,
    );
    expect(screen.getByTestId("governance-signed-records-list-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_SIGNED_RECORDS_LIST_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("signed-records-review-detail-vocabulary")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Claims modernization" })).toBeInTheDocument();
    });

    const primary = screen.getByTestId("governance-signed-records-list-primary-content");
    const orientation = screen.getByTestId("signed-records-list-orientation-bottom");
    const recordCount = screen.getByTestId("signed-records-list-record-count");

    expect(primary).toContainElement(orientation);
    expect(recordCount.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
