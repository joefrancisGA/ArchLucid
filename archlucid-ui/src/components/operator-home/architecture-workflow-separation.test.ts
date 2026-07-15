import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const dualPathSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "OperatorHomeDualPathCards.tsx"),
  "utf8",
);

const createNavSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../hooks/use-create-architecture-navigation.ts"),
  "utf8",
);

const pilotNavSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../lib/pilot-nav-group-builder.ts"),
  "utf8",
);

describe("architecture creation vs review workflow separation", () => {
  it("routes homepage create architecture through the dedicated navigation hook", () => {
    expect(dualPathSource).toContain("useCreateArchitectureNavigation");
    expect(dualPathSource).not.toContain("REVIEWS_NEW_GUIDED_INTAKE_HREF");
    expect(dualPathSource).toContain('selectedPath === "create-architecture"');
  });

  it("keeps review staged progress off the create architecture card", () => {
    expect(dualPathSource).toContain("reviewNavigation.showStagedPanel");
    expect(dualPathSource).not.toMatch(/createArchitectureNavigation\.showStagedPanel/);
  });

  it("navigates create architecture to /architectures/new", () => {
    expect(createNavSource).toContain("ARCHITECTURES_NEW_PATH");
    expect(createNavSource).not.toContain("/reviews/new?path=guided-intake&intent=create-architecture");
  });

  it("separates create architecture and start review in pilot nav", () => {
    expect(pilotNavSource).toContain('href: ARCHITECTURES_NEW_PATH');
    expect(pilotNavSource).toContain('href: "/reviews/new"');
    expect(pilotNavSource).toContain("START_REVIEW_LABEL");
    expect(pilotNavSource).toContain("CREATE_ARCHITECTURE_LABEL");
  });
});
