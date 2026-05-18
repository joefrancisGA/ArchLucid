import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BACKUP_ENV = process.env;

vi.mock("@/components/BeforeAfterDelta/useDeltaQuery", () => ({
  useDeltaQuery: () => ({ status: "ready", data: { items: [] } }),
}));

describe("PostCommitAdvancedAnalysisHint", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...BACKUP_ENV };
    vi.restoreAllMocks();
  });

  it("surfaces showcase compare CTA on the curated demo run when buyer chrome is enabled", async () => {
    process.env = { ...BACKUP_ENV, NEXT_PUBLIC_DEMO_MODE: "true", NEXT_PUBLIC_DEMO_STATIC_OPERATOR: "false" };

    const { PostCommitAdvancedAnalysisHint: Hint } = await import("@/components/PostCommitAdvancedAnalysisHint");

    render(<Hint runId="claims-intake-modernization" />);

    const compareCta = screen.getByTestId("post-commit-compare-prior-cta");

    expect(compareCta).toHaveAttribute(
      "href",
      "/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-run-v2",
    );
    expect(compareCta).toHaveTextContent(/view review change comparison/i);
  });
});
