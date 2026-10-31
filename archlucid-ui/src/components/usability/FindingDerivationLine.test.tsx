import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { buildFindingDerivationSentence } from "@/lib/findings/finding-derivation-sentence";

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

  it("labels omitted evidenceRefCount without Open finding (P-12)", () => {
    const derivation = buildFindingDerivationSentence({
      ruleName: "Ingress rule",
      severityLabel: "High",
      evidenceRefCount: null,
    });

    render(
      <FindingDerivationLine
        derivation={derivation}
        evidenceHref="/architecture/reviews/run-1/findings/finding-1/evidence-trace"
        evidenceRefCount={null}
        testId="derivation-test"
      />,
    );

    expect(screen.getByTestId("derivation-test-evidence-link")).toHaveTextContent(
      "Evidence reference count was not stored",
    );
  });

  it("does not double-prefix assembled derivation sentences (P-12)", () => {
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

    const sentence = screen.getByTestId("derivation-test-sentence").textContent ?? "";
    const assembledPrefixCount = (sentence.match(/Assembled from stored rule/g) ?? []).length;

    expect(assembledPrefixCount).toBe(1);
  });

  it("labels a missing evidence href in full layout (P-13)", () => {
    const derivation = buildFindingDerivationSentence({
      ruleName: "Ingress rule",
      severityLabel: "High",
      evidenceRefCount: 0,
    });

    render(<FindingDerivationLine derivation={derivation} evidenceHref={null} testId="derivation-test" />);

    expect(screen.getByTestId("derivation-test-evidence-missing")).toHaveTextContent(
      "Evidence trail link was not stored.",
    );
  });

  it("labels a missing evidence href in compact mode (P-12)", () => {
    const derivation = buildFindingDerivationSentence({
      ruleName: "Ingress rule",
      severityLabel: "High",
      evidenceRefCount: 0,
    });

    render(<FindingDerivationLine derivation={derivation} evidenceHref={null} compact testId="derivation-test" />);

    expect(screen.getByTestId("derivation-test-evidence-missing")).toHaveTextContent(
      "Evidence trail link was not stored.",
    );
    expect(screen.queryByTestId("derivation-test-evidence-link")).toBeNull();
  });
});
