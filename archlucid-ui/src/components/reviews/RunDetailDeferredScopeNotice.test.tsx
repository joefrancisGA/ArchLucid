import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailDeferredScopeNotice } from "@/components/reviews/RunDetailDeferredScopeNotice";

describe("RunDetailDeferredScopeNotice", () => {
  it("renders nothing when deferred requirements are absent", () => {
    const { container } = render(<RunDetailDeferredScopeNotice deferredBuyerRequirementsPresent={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("lists safe deferred-scope wording for SOC 2, pen test, connectors, MCP, and commerce", () => {
    render(<RunDetailDeferredScopeNotice deferredBuyerRequirementsPresent={true} />);

    expect(screen.getByTestId("run-detail-deferred-scope-notice")).toBeInTheDocument();
    expect(screen.getByTestId("deferred-scope-item-soc2-cpa")).toHaveTextContent("TB-135");
    expect(screen.getByTestId("deferred-scope-item-third-party-pentest")).toHaveTextContent("TB-136");
    expect(screen.getByTestId("deferred-scope-item-native-connectors")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("deferred-scope-item-mcp-marketplace")).toHaveTextContent("deferred");
    expect(screen.getByTestId("deferred-scope-item-live-commerce")).toHaveTextContent("deferred");
  });
});
