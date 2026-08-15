import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isOperatorExperienceFullShellEnv: (): boolean => true,
  };
});

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/governance/sealed-records/manifest-1/artifacts/artifact-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/operator/OperatorDemoStaticBanner", () => ({
  OperatorDemoStaticBanner: () => <div data-testid="operator-demo-static-banner" />,
}));

vi.mock("@/components/operator/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: () => <div data-testid="operator-evidence-limits-footer" />,
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
  usedStaticDemoFallback: true,
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
    readableText: "{
  "total": 1
}
",
    rawText: "{"total":1}",
    jsonPrettyFailed: false,
  },
  contentType: "application/json",
  byteLength: 12,
  truncated: false,
  contentError: null,
  runId: "22222222-2222-4222-8222-222222222222",
};

describe("SignedRecordArtifactPageView buyer-polished shell", () => {
  it("uses buyer subtitle, refresh, breadcrumb, demo banner, and contextual help", () => {
    refresh.mockReset();

    render(<SignedRecordArtifactPageView model={model} />);

    expect(screen.getByText(BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("governance-sealed-record-artifact-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("operator-demo-static-banner")).toBeInTheDocument();
    expect(screen.getByTestId("operator-evidence-limits-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("signed-record-orientation")).toBeNull();
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("signed-record-artifact-scope-details")).toBeNull();
    expect(screen.getByTestId("signed-record-artifact-content-hash")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-generated-timestamp")).toBeInTheDocument();
  });

  it("shows skeleton while refresh is in flight", () => {
    refresh.mockReset();

    render(<SignedRecordArtifactPageView model={model} />);

    fireEvent.click(screen.getByTestId("signed-record-artifact-refresh-button"));

    expect(screen.getByTestId("signed-record-artifact-page-skeleton")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
