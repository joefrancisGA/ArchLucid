import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/policy-packs",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import type { PolicyPacksLifecycleSectionProps } from "./PolicyPacksLifecycleSection";

function lifecycleProps(
  overrides: Partial<PolicyPacksLifecycleSectionProps> = {},
): PolicyPacksLifecycleSectionProps {
  return {
    canMutatePacks: true,
    loading: false,
    selectedPackId: "",
    verticalImportSlug: null,
    bundledPublishBlocked: false,
    onImportVertical: vi.fn(),
    name: "Organization security architecture starter",
    onNameChange: vi.fn(),
    description: "",
    onDescriptionChange: vi.fn(),
    packType: "ProjectCustom",
    onPackTypeChange: vi.fn(),
    createJson: "{\"metadata\":{\"note\":\"{{organization.allowedRegions}}\"}}",
    createPlaceholderValidationMessage: "Fill in required policy values: {{organization.allowedRegions}}.",
    onCreateJsonChange: vi.fn(),
    onCreate: vi.fn(),
    createLastSavedUtc: null,
    createInlineSaveError: null,
    publishVersion: "1.0.0",
    onPublishVersionChange: vi.fn(),
    publishJson: "{}",
    onPublishJsonChange: vi.fn(),
    onPublish: vi.fn(),
    publishLastSavedUtc: null,
    publishInlineSaveError: null,
    assignVersion: "1.0.0",
    onAssignVersionChange: vi.fn(),
    assignScopeLevel: "Project",
    onAssignScopeLevelChange: vi.fn(),
    assignPinned: false,
    onAssignPinnedChange: vi.fn(),
    onAssign: vi.fn(),
    pickedReviewId: "",
    onPickReviewForAssign: vi.fn(),
    ...overrides,
  };
}

describe("PolicyPacksLifecycleSection placeholders", () => {
  it("keeps create disabled and shows the form error while a required placeholder is empty", () => {
    render(<PolicyPacksLifecycleSection {...lifecycleProps()} />);

    expect(screen.getByRole("button", { name: "Create pack" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("{{organization.allowedRegions}}");
  });

  it("enables create after required placeholders are filled", () => {
    render(
      <PolicyPacksLifecycleSection
        {...lifecycleProps({
          createJson: "{\"metadata\":{\"note\":\"eastus\"}}",
          createPlaceholderValidationMessage: null,
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Create pack" })).toBeEnabled();
  });
});
