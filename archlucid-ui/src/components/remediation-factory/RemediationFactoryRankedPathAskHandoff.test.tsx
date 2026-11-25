import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemediationFactoryRankedPathAskHandoff } from "./RemediationFactoryRankedPathAskHandoff";

describe("RemediationFactoryRankedPathAskHandoff", () => {
  it("links Ask with securityEvidencePathId", () => {
    render(<RemediationFactoryRankedPathAskHandoff testId="ranked-path-ask" snapshotId="11111111-1111-1111-1111-111111111111" securityEvidencePathId="22222222-2222-2222-2222-222222222222" />);
    expect(screen.getByTestId("ranked-path-ask-link").getAttribute("href")).toContain("securityEvidencePathId=22222222-2222-2222-2222-222222222222");
  });
});
