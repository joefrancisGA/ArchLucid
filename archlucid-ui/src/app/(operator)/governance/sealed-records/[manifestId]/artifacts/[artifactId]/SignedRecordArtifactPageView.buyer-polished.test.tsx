import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/governance/sealed-records/manifest-1/artifacts/artifact-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SignedRecordArtifactPageView } from "./_sections/SignedRecordArtifactPageView";
import {
  BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
} from "@/lib/signed-record-artifact-page-copy";
import type { SignedRecordArtifactPageSuccessModel } from "./_sections/signed-record-artifact-page-model";

const model: SignedRecordArtifactPageSuccessModel = {
  manifestId: "11111111-1111-4111-8111-111111111111",
  artifactId: "cost-summary",
  buyerPolishedLayout: true,
  descriptor: {
    artifactId: "cost-summary",
    artifactType: "CostSummary",
    name: "cost-summary.json",
    format: "json",
    createdUtc: "2026-07-01T12:00:00.000Z",
    contentHash: "abc123",
    manifestId: "11111111-1111-4111-8111-111111111111",
    runId: "22222222-2222-4222-8222-222222222222",
  },
  siblings: [],
  prepared: {
    viewKind: "json",
    readableText: "{\n  \"total\": 1\n}\n",
    rawText: "{\"total\":1}",
    jsonPrettyFailed: false,
  },
  contentType: "application/json",
  byteLength: 12,
  truncated: false,
  contentError: null,
  runId: "22222222-2222-4222-8222-222222222222",
};

describe("SignedRecordArtifactPageView buyer-polished shell", () => {
  it("uses buyer subtitle, refresh, and contextual help without Sources or About-scope chrome", () => {
    render(<SignedRecordArtifactPageView model={model} />);

    expect(screen.getByText(BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("signed-record-orientation")).toBeNull(); // TB-2092
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("signed-record-artifact-scope-details")).toBeNull(); // TB-2093
  });
});