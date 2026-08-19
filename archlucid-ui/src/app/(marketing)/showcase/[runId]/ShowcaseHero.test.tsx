import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(marketing)/see-it/SeeItDeliverablePreview", () => ({
  SeeItDeliverablePreview: () => <div data-testid="see-it-deliverable-preview-mock" />,
}));

import { ShowcaseHero } from "@/app/(marketing)/showcase/[runId]/ShowcaseHero";
import {
  SHOWCASE_HERO_SUBTITLE,
  showcaseTitleForRunId,
} from "@/lib/showcase-page-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("ShowcaseHero", () => {
  it("renders breadcrumb, title, buyer subtitle, and deliverable preview rail", () => {
    render(<ShowcaseHero runId={SHOWCASE_STATIC_DEMO_RUN_ID} />);

    expect(screen.getByTestId("showcase-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("showcase-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: showcaseTitleForRunId(SHOWCASE_STATIC_DEMO_RUN_ID) })).toBeInTheDocument();
    expect(screen.getByTestId("showcase-hero-subtitle")).toHaveTextContent(SHOWCASE_HERO_SUBTITLE);
    expect(screen.getByTestId("see-it-deliverable-preview-mock")).toBeInTheDocument();
  });
});
