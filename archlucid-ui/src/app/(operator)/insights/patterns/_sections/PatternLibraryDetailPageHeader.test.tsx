import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatternLibraryDetailPageHeader } from "./PatternLibraryDetailPageHeader";
import { patternLibraryDetailSubtitle } from "@/lib/pattern-library-copy";
import type { PatternLibraryProvenance } from "@/lib/pattern-library-types";

const provenance: PatternLibraryProvenance = {
  badgeLabel: "Sample data",
  notice: "Sample pattern data is shown in this workspace.",
  privacyNote: "Tenant-identifying data is never shown.",
};

describe("PatternLibraryDetailPageHeader", () => {
  it("renders breadcrumb, help, refresh, provenance badge, and freshness metadata", () => {
    const onRefresh = vi.fn();

    render(
      <PatternLibraryDetailPageHeader
        patternKey="private-endpoints-paas"
        patternName="Private endpoints for PaaS"
        subtitle={patternLibraryDetailSubtitle("Full operator description.", true)}
        provenance={provenance}
        showProvenanceDetails={false}
        refreshing={false}
        lastUpdatedUtc="2026-07-09T12:00:00.000Z"
        badges={<span data-testid="pattern-library-detail-header-badges">badges</span>}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByTestId("pattern-library-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-provenance-badge")).toHaveTextContent("Sample data");
    expect(screen.getByTestId("pattern-library-detail-last-updated")).toHaveTextContent(/Last updated:/i);
    expect(screen.getByTestId("pattern-library-detail-header-badges")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pattern-library-detail-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
