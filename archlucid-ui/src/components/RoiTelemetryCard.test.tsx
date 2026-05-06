import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiTelemetryCard } from "@/components/RoiTelemetryCard";

describe("RoiTelemetryCard", () => {
  it("hides USD controls for non-admin", () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        severity={{ critical: 1, high: 0, medium: 0 }}
        precommitBlocks={1}
        precommitBlocksExact
        isAdmin={false}
      />,
    );

    expect(screen.queryByLabelText(/Loaded engineering cost per hour/i)).toBeNull();
    expect(screen.getByText(/Model:/)).toBeInTheDocument();
  });

  it("shows USD controls for admin after mount", async () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        severity={{ critical: 0, high: 0, medium: 0 }}
        precommitBlocks={0}
        precommitBlocksExact
        isAdmin={true}
      />,
    );

    expect(await screen.findByLabelText(/Loaded engineering cost per hour/i)).toBeInTheDocument();
  });

  it("labels sampled pre-commit blocks", () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        severity={{ critical: 0, high: 0, medium: 0 }}
        precommitBlocks={400}
        precommitBlocksExact={false}
        isAdmin={false}
      />,
    );

    expect(screen.getByText(/400 \(sampled\)/)).toBeInTheDocument();
  });

  it("shows Implied dollar total for admin only when rounding would not display as $0", async () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        severity={{ critical: 0, high: 0, medium: 10 }}
        precommitBlocks={0}
        precommitBlocksExact
        isAdmin={true}
      />,
    );

    expect(await screen.findByText(/Implied total:/)).toBeInTheDocument();
  });

  it("omits misleading $0 implied total when hours × rate rounds down", async () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        severity={{ critical: 0, high: 0, medium: 0.001 }}
        precommitBlocks={0}
        precommitBlocksExact
        isAdmin={true}
      />,
    );

    expect(await screen.findByLabelText(/Loaded engineering cost per hour/i)).toBeInTheDocument();
    expect(screen.queryByText(/Implied total:/)).toBeNull();
    expect(screen.getByText(/Dollar total would round to \$0/i)).toBeInTheDocument();
  });
});
