import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { buildFindingDerivationSentence } from "@/lib/finding-derivation-sentence";

describe("FindingDerivationLine (TB-2154)", () => {
  it("renders derivation sentence and evidence expand link", () => {
    const derivation = buildFindingDerivationSentence({
      ruleName: "Ingress rule",
      severityLabel: "High",
      evidenceRefCount: 1,
    });

    render(
      <FindingDerivationLine
        derivation={derivation}
        evidenceHref="/architecture/reviews/run-1/findings/finding-1/evidence-trace"
        testId="derivation-test"
      />,
    );

    expect(screen.getByTestId("derivation-test-sentence")).toHaveTextContent('Policy rule "Ingress rule"');
    expect(screen.getByTestId("derivation-test-evidence-link")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
    );
  });
});
