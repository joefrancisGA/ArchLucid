import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import {
  AUDIT_EVIDENCE_TRAIL_AUDIT_LINK,
  AUDIT_EVIDENCE_TRAIL_COMPACT_LINE,
  AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
  AUDIT_EVIDENCE_TRAIL_HEADING,
  AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
  AUDIT_EVIDENCE_TRAIL_WHY_THREE,
} from "@/lib/audit-evidence-trail-vocabulary";

describe("AuditEvidenceTrailVocabularyRail (TB-2255)", () => {
  it("from audit links both evidence surfaces", () => {
    render(<AuditEvidenceTrailVocabularyRail currentSurfaceId="audit" />);

    const strip = screen.getByTestId("audit-evidence-trail-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "audit");
    expect(strip.textContent ?? "").toContain(AUDIT_EVIDENCE_TRAIL_COMPACT_LINE);

    const graph = screen.getByTestId("audit-evidence-trail-vocabulary-peer-evidence-graph");
    expect(graph).toHaveTextContent(AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK.label);
    expect(graph).toHaveAttribute("href", AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK.href);

    const search = screen.getByTestId("audit-evidence-trail-vocabulary-peer-search-evidence");
    expect(search).toHaveTextContent(AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK.label);
    expect(search).toHaveAttribute("href", AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK.href);
  });

  it("from evidence graph links audit and search evidence", () => {
    render(<AuditEvidenceTrailVocabularyRail currentSurfaceId="evidence-graph" />);

    const audit = screen.getByTestId("audit-evidence-trail-vocabulary-peer-audit");
    expect(audit).toHaveTextContent(AUDIT_EVIDENCE_TRAIL_AUDIT_LINK.label);
    expect(audit).toHaveAttribute("href", AUDIT_EVIDENCE_TRAIL_AUDIT_LINK.href);

    expect(
      screen.getByTestId("audit-evidence-trail-vocabulary-peer-search-evidence"),
    ).toHaveAttribute("href", AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK.href);
  });

  it("from search evidence links audit and evidence graph", () => {
    render(<AuditEvidenceTrailVocabularyRail currentSurfaceId="search-evidence" />);

    expect(screen.getByTestId("audit-evidence-trail-vocabulary-peer-audit")).toHaveAttribute(
      "href",
      AUDIT_EVIDENCE_TRAIL_AUDIT_LINK.href,
    );
    expect(
      screen.getByTestId("audit-evidence-trail-vocabulary-peer-evidence-graph"),
    ).toHaveAttribute("href", AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK.href);
  });

  it("renders full variant with why-three explanation", () => {
    render(<AuditEvidenceTrailVocabularyRail currentSurfaceId="audit" variant="full" />);

    const strip = screen.getByTestId("audit-evidence-trail-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(AUDIT_EVIDENCE_TRAIL_HEADING)).toBeInTheDocument();
    expect(screen.getByText(AUDIT_EVIDENCE_TRAIL_WHY_THREE)).toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-trail-vocabulary-current")).toHaveTextContent(
      AUDIT_EVIDENCE_TRAIL_AUDIT_LINK.label,
    );
  });
});
