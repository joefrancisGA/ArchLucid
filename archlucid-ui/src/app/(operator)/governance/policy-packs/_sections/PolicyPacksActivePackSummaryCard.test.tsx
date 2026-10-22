import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPacksActivePackSummaryCard } from "./PolicyPacksActivePackSummaryCard";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe("PolicyPacksActivePackSummaryCard", () => {
  it("labels unresolved effective set as not loaded", () => {
    render(
      <PolicyPacksActivePackSummaryCard
        effective={null}
        effectiveContent={null}
        selectedPack={{
          policyPackId: "pack-1",
          name: "Catalog pack",
          packType: "Regulatory",
          currentVersion: "1.0.0",
        } as never}
        enforcedRuleCount={0}
        canMutatePacks={false}
        onOpenCatalog={() => {}}
      />,
    );

    expect(screen.getByText("Not loaded")).toBeInTheDocument();
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
    expect(screen.getByText(/Effective policy pack set not loaded/)).toBeInTheDocument();
    expect(screen.queryByText(/is enabled for this workspace/)).not.toBeInTheDocument();
  });
});
