import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HealthStatusTag } from "@/components/health-dashboard/HealthStatusTag";

const SRC_ROOT = join(process.cwd(), "src");

const TB_2287_MIGRATED_MODULES = [
  "components/health-dashboard/HealthStatusChip.tsx",
  "app/(operator)/internal/health/_sections/AdminHealthPageView.tsx",
  "components/advisory/AdvisoryRecommendationCard.tsx",
  "components/llm/LlmBudgetStatusPill.tsx",
] as const;

describe("TB-2287 health/ops/advisory StatusTag migration contract", () => {
  it.each(TB_2287_MIGRATED_MODULES)("does not import StatusPill from %s", (relativePath) => {
    const source = readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");

    expect(source).not.toMatch(/from ["']@\/components\/StatusPill["']/);
  });

  it("HealthStatusChip composes HealthStatusTag", () => {
    const source = readFileSync(join(SRC_ROOT, "components/health-dashboard/HealthStatusChip.tsx"), "utf8");

    expect(source).toContain("HealthStatusTag");
  });

  it("LlmBudgetStatusPill resolves budget labels via TB-2285", () => {
    const source = readFileSync(join(SRC_ROOT, "components/llm/LlmBudgetStatusPill.tsx"), "utf8");

    expect(source).toContain("resolveEnterpriseStatusKind");
    expect(source).toContain('"budget"');
  });
});

describe("HealthStatusTag", () => {
  it("renders StatusTag with health resolver kind and left-accent shell", () => {
    render(<HealthStatusTag status="Healthy" aria-label="Dependency: Healthy" />);

    const tag = screen.getByLabelText("Dependency: Healthy");

    expect(tag).toHaveTextContent("Healthy");
    expect(tag.className).toContain("border-l-[3px]");
  });

  it("maps circuit breaker Open to blocked", () => {
    render(<HealthStatusTag status="Open" />);

    const tag = screen.getByLabelText("Status: Open");

    expect(tag.className).toContain("border-l-rose");
  });
});
