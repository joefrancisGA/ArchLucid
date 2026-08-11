import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import {
  WEBHOOKS_VS_DLQ_COMPACT_LINE,
  WEBHOOKS_VS_DLQ_DLQ_LINK,
  WEBHOOKS_VS_DLQ_HEADING,
  WEBHOOKS_VS_DLQ_WEBHOOKS_LINK,
  WEBHOOKS_VS_DLQ_WHY_TWO,
} from "@/lib/vocabulary/webhooks-vs-dlq-vocabulary";

describe("WebhooksVsDlqVocabularyRail (TB-2264)", () => {
  it("renders webhooks strip with peer link to dlq", () => {
    render(<WebhooksVsDlqVocabularyRail currentSurfaceId="webhooks" />);

    const strip = screen.getByTestId("webhooks-vs-dlq-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "webhooks");
    expect(strip.textContent ?? "").toContain(WEBHOOKS_VS_DLQ_COMPACT_LINE);

    const peer = screen.getByTestId("webhooks-vs-dlq-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_VS_DLQ_DLQ_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_VS_DLQ_DLQ_LINK.href);
  });

  it("renders dlq strip with peer link to webhooks", () => {
    render(<WebhooksVsDlqVocabularyRail currentSurfaceId="dlq" />);

    expect(screen.getByTestId("webhooks-vs-dlq-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "dlq",
    );

    const peer = screen.getByTestId("webhooks-vs-dlq-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_VS_DLQ_WEBHOOKS_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_VS_DLQ_WEBHOOKS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<WebhooksVsDlqVocabularyRail currentSurfaceId="webhooks" variant="full" />);

    const strip = screen.getByTestId("webhooks-vs-dlq-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(WEBHOOKS_VS_DLQ_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WEBHOOKS_VS_DLQ_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-vs-dlq-vocabulary-current")).toHaveTextContent(
      WEBHOOKS_VS_DLQ_WEBHOOKS_LINK.label,
    );
  });
});
