import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { createMinimalDemoPreviewPayload } from "@/app/(marketing)/see-it/see-it.fixtures";

import { DemoPreviewMarketingBody } from "./DemoPreviewMarketingBody";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "architecture-showcase-001"),
}));

describe("DemoPreviewMarketingBody sign-in return path", () => {
  it("uses showcase operator review href with desk continuity", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run = { ...payload.run, runId: SHOWCASE_STATIC_DEMO_RUN_ID };

    render(<DemoPreviewMarketingBody payload={payload} />);

    const nestedReturnPath = `/architecture/architectures/architecture-showcase-001/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`;
    const expectedSignInHref = `/auth/signin?returnUrl=${encodeURIComponent(nestedReturnPath)}`;

    expect(screen.getByTestId("demo-preview-signin-cta")).toHaveAttribute("href", expectedSignInHref);
    expect(vi.mocked(readCachedLastOpenArchitectureId)).toHaveBeenCalled();
  });
});
