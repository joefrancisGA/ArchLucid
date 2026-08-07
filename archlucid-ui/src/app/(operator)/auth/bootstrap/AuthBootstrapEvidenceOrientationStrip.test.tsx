import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthBootstrapEvidenceOrientationStrip } from "@/app/(operator)/auth/bootstrap/AuthBootstrapEvidenceOrientationStrip";
import {
  AUTH_BOOTSTRAP_CANONICAL_PATH,
  AUTH_BOOTSTRAP_SOURCES,
} from "@/lib/auth-bootstrap-evidence-copy";

describe("AuthBootstrapEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking auth bootstrap", () => {
    render(<AuthBootstrapEvidenceOrientationStrip />);

    expect(screen.getByTestId("auth-bootstrap-sources")).toBeInTheDocument();
    expect(screen.getByTestId("auth-bootstrap-claim-discipline")).toBeInTheDocument();

    for (const link of AUTH_BOOTSTRAP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AUTH_BOOTSTRAP_SOURCES.some((link) => link.href === AUTH_BOOTSTRAP_CANONICAL_PATH)).toBe(false);
  });
});
