import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";

vi.mock("@/lib/api/policy-pack-generate-api", () => ({
  generatePolicyPackFromPrompt: vi.fn(),
}));

import { generatePolicyPackFromPrompt } from "@/lib/api/policy-pack-generate-api";

import { PolicyPackNaturalLanguageBuilder } from "./PolicyPackNaturalLanguageBuilder";

const mockGenerate = vi.mocked(generatePolicyPackFromPrompt);

const validDocumentJson = JSON.stringify({
  schemaVersion: 1,
  kind: "archlucid.policyPack.curatedRules.v1",
  pack: {
    name: "Encryption pack",
    description: "Encrypt sensitive data at rest across Azure data stores.",
    version: "1.0.0",
    category: "Security",
    isDefault: false,
    suggestedPackType: "ProjectCustom",
    policyPackContentDocumentPath: "",
  },
  rules: [
    {
      id: "encrypt-data-at-rest",
      title: "Encrypt data at rest",
      description: "All databases must use customer-managed key encryption.",
      severity: "Critical",
      remediationGuidance: "Enable CMK on each datastore.",
      evidenceHints: ["datastores[].EncryptionAtRest"],
      frameworkMappings: [{ framework: "SOC2", requirement: "CC6.1" }],
    },
  ],
});

describe("PolicyPackNaturalLanguageBuilder", () => {
  it("shows human review callout by default", () => {
    render(<PolicyPackNaturalLanguageBuilder canMutatePacks onGenerated={vi.fn()} />);

    expect(screen.getByTestId("policy-pack-nl-human-review-callout")).toBeInTheDocument();
    expect(screen.getByText(/Generated packs require human review before publish/i)).toBeInTheDocument();
  });

  it("renders validation warnings and still calls onGenerated", async () => {
    const onGenerated = vi.fn();

    mockGenerate.mockResolvedValue({
      disclaimer: "Review required.",
      curatedRulesDocumentJson: validDocumentJson,
      validationWarnings: ["Rule 'encrypt-data-at-rest' has empty remediationGuidance."],
      requiresHumanReview: true,
    });

    render(<PolicyPackNaturalLanguageBuilder canMutatePacks onGenerated={onGenerated} />);

    fireEvent.change(screen.getByTestId("policy-pack-nl-prompt"), {
      target: { value: "Create an encryption pack for Azure databases with customer-managed keys." },
    });
    fireEvent.click(screen.getByTestId("policy-pack-nl-generate"));

    await waitFor(() => {
      expect(screen.getByTestId("policy-pack-nl-validation-warnings")).toBeInTheDocument();
    });

    expect(onGenerated).toHaveBeenCalledOnce();
  });

  it("shows friendly copy on 422 validation error", async () => {
    mockGenerate.mockRejectedValue(
      new ApiRequestError("Duplicate rule id 'shared-id'.", {
        httpStatus: 422,
        problem: { status: 422, title: "Validation failed", detail: "Duplicate rule id 'shared-id'." },
        correlationId: "corr-422",
      }),
    );

    render(<PolicyPackNaturalLanguageBuilder canMutatePacks onGenerated={vi.fn()} />);

    fireEvent.change(screen.getByTestId("policy-pack-nl-prompt"), {
      target: { value: "Create an encryption pack for Azure databases with customer-managed keys." },
    });
    fireEvent.click(screen.getByTestId("policy-pack-nl-generate"));

    await waitFor(() => {
      expect(screen.getByText(/Revise your prompt and try again/i)).toBeInTheDocument();
    });
  });
});
