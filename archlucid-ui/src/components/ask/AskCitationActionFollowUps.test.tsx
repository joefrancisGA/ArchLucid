import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskCitationActionFollowUps } from "@/components/ask/AskCitationActionFollowUps";
import type { AskCitationActionFollowUp } from "@/lib/ask-citation-action-follow-ups";

describe("AskCitationActionFollowUps", () => {
  const chips: AskCitationActionFollowUp[] = [
    {
      kind: "finding",
      label: "Open finding",
      href: "/architecture/reviews/run-a/findings/f-1",
      citationId: "f-1",
    },
    {
      kind: "evidence",
      label: "Open evidence",
      href: "/architecture/reviews/run-a/findings/f-1/evidence-trace",
      citationId: "f-1",
    },
  ];

  it("renders deep-link chips with the TB-2219 test id", () => {
    render(<AskCitationActionFollowUps chips={chips} />);

    expect(screen.getByTestId("ask-citation-action-follow-ups")).toBeInTheDocument();
    expect(screen.getByTestId("ask-citation-action-finding")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a/findings/f-1",
    );
    expect(screen.getByTestId("ask-citation-action-evidence")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a/findings/f-1/evidence-trace",
    );
  });

  it("renders nothing when chips are empty and honest empty is off", () => {
    const { container } = render(<AskCitationActionFollowUps chips={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows an honest empty note when requested", () => {
    render(<AskCitationActionFollowUps chips={[]} showHonestEmpty />);

    expect(screen.getByTestId("ask-citation-action-follow-ups")).toHaveTextContent(
      /No linked finding, evidence, or decision/i,
    );
  });
});
