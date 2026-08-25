import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftStructuredBriefFields } from "@/components/architecture/ArchitectureDraftStructuredBriefFields";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { draftArchitectureRequestWithPoll } from "@/lib/api/architecture-request-draft-async-api";
import { explainStructuredBriefSuggestion } from "@/lib/api/structured-brief-suggestion-explain-api";
import { ApiRequestError } from "@/lib/api-request-error";
import { clearStructuredBriefSuggestionExplainCache } from "@/lib/architecture/structured-brief-suggestion-explain-cache";
import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  emptyArchitectureDraftStructuredBrief,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_SECTION, GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY } from "@/lib/guided-intake-copy";

vi.mock("@/lib/api/architecture-request-draft-api", () => ({
  ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS: 20,
  draftArchitectureRequest: vi.fn(),
}));

vi.mock("@/lib/api/architecture-request-draft-async-api", () => ({
  draftArchitectureRequestWithPoll: vi.fn(),
}));

vi.mock("@/lib/api/structured-brief-suggestion-explain-api", () => ({
  explainStructuredBriefSuggestion: vi.fn(),
  buildStructuredBriefSuggestionExplainCacheKey: vi.fn(async () => "cache-key-structured-brief"),
}));

const mockedDraftArchitectureRequestWithPoll = vi.mocked(draftArchitectureRequestWithPoll);
const mockedExplainStructuredBriefSuggestion = vi.mocked(explainStructuredBriefSuggestion);

const draftSuggestPollOptionsMatcher = expect.objectContaining({
  onUpdate: expect.any(Function),
});

function expectDraftSuggestInput(
  input: Parameters<typeof draftArchitectureRequestWithPoll>[0],
): void {
  expect(mockedDraftArchitectureRequestWithPoll).toHaveBeenCalledWith(
    expect.objectContaining(input),
    draftSuggestPollOptionsMatcher,
  );
}

const succeededDraftSuggestOperation = {
  operationId: "draft:11111111-1111-1111-1111-111111111111",
  state: "Succeeded" as const,
  stepLabel: "Suggestions ready",
  heartbeatUtc: "2026-01-01T00:00:00.000Z",
  currentStep: 4,
  totalSteps: 4,
  resultRef: null,
};

function mockDraftSuggestResponse(response: {
  readonly suggestedConstraints?: readonly string[];
  readonly suggestedAssumptions?: readonly string[];
  readonly suggestedCapabilities?: readonly string[];
  readonly topologyHints?: readonly string[];
  readonly securityBaselineHints?: readonly string[];
  readonly suggestedFailureModeNote?: string | null;
  readonly evidenceContradictedAssumptions?: readonly { assumption: string; evidenceNote: string }[];
}): void {
  mockedDraftArchitectureRequestWithPoll.mockResolvedValue({
    response: {
      suggestedConstraints: [...(response.suggestedConstraints ?? [])],
      suggestedAssumptions: [...(response.suggestedAssumptions ?? [])],
      suggestedCapabilities: [...(response.suggestedCapabilities ?? [])],
      topologyHints: [...(response.topologyHints ?? [])],
      securityBaselineHints: [...(response.securityBaselineHints ?? [])],
      suggestedFailureModeNote: response.suggestedFailureModeNote,
      evidenceContradictedAssumptions: response.evidenceContradictedAssumptions
        ? [...response.evidenceContradictedAssumptions]
        : undefined,
    },
    operation: succeededDraftSuggestOperation,
  });
}

function StructuredBriefHarness(props: {
  readonly initialBrief?: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly blocksLlmExecution?: boolean;
  readonly disabled?: boolean;
}): React.JSX.Element {
  const [structuredBrief, setStructuredBrief] = useState(
    props.initialBrief ?? emptyArchitectureDraftStructuredBrief(),
  );

  return (
    <ArchitectureDraftStructuredBriefFields
      structuredBrief={structuredBrief}
      freeTextIntent={props.freeTextIntent}
      blocksLlmExecution={props.blocksLlmExecution}
      disabled={props.disabled}
      onStructuredBriefChange={setStructuredBrief}
    />
  );
}

describe("ArchitectureDraftStructuredBriefFields", () => {
  beforeEach(() => {
    clearStructuredBriefSuggestionExplainCache();
    mockedExplainStructuredBriefSuggestion.mockReset();
    mockedDraftArchitectureRequestWithPoll.mockReset();
  });

  it("shows suggested items after a successful suggest call", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: ["Single-region pilot"],
      suggestedCapabilities: ["Private networking"],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    expect(await screen.findByText("EU data residency")).toBeInTheDocument();
    expect(screen.getByText("Single-region pilot")).toBeInTheDocument();
    expect(screen.getByText("Private networking")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief-success")).toHaveTextContent(
      "Added 3 suggestions below",
    );
    expect(screen.queryByTestId("architecture-draft-suggest-structured-brief-empty")).not.toBeInTheDocument();
    expectDraftSuggestInput({
      freeTextDescription:
        "Architecture overview:\nTenant migration platform with private networking and EU residency goals.",
      currentConstraints: [],
      currentAssumptions: [],
      confirmedAssumptions: [],
    });
  });

  it("sends confirmed and suggested constraints and assumptions to the draft API", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        initialBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: ["Encryption at rest"],
          suggestedAssumptions: ["Stable internet connection"],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    await waitFor(() => {
      expectDraftSuggestInput({
        freeTextDescription:
          "Architecture overview:\nTenant migration platform with private networking and EU residency goals.\n\nConfirmed constraints:\n- Encryption at rest",
        currentConstraints: ["Encryption at rest"],
        currentAssumptions: ["Stable internet connection"],
        confirmedAssumptions: [],
      });
    });
  });

  it("shows vertically stacked suggestions with confirm, deny, and explain actions", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    expect(within(suggestion).getByText("EU data residency")).toBeInTheDocument();
    expect(within(suggestion).getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(within(suggestion).getByRole("button", { name: "Deny" })).toBeInTheDocument();
    expect(within(suggestion).getByRole("button", { name: /Explain/i })).toBeInTheDocument();
    expect(screen.queryByText("Suggested", { selector: "span" })).not.toBeInTheDocument();
  });

  it("fetches explanation on demand when Explain is opened", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });
    mockedExplainStructuredBriefSuggestion.mockResolvedValue({
      explanation:
        "Your overview mentioned EU customers. Confirming this tells the review to keep data in EU regions.",
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    fireEvent.click(within(suggestion).getByRole("button", { name: /Explain/i }));

    expect(
      await within(suggestion).findByText(/Confirming this tells the review to keep data in EU regions/i),
    ).toBeInTheDocument();
    expect(mockedExplainStructuredBriefSuggestion).toHaveBeenCalledTimes(1);
  });

  it("still allows confirm after explain fetch fails", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });
    mockedExplainStructuredBriefSuggestion.mockRejectedValue(
      new ApiRequestError("Explain failed.", {
        problem: null,
        correlationId: null,
        httpStatus: 500,
      }),
    );

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    fireEvent.click(within(suggestion).getByRole("button", { name: /Explain/i }));
    expect(await within(suggestion).findByText("Explain failed.")).toBeInTheDocument();

    fireEvent.click(within(suggestion).getByRole("button", { name: "Confirm" }));

    expect(screen.queryByTestId("architecture-draft-constraints-suggestion")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove EU data residency" })).toBeInTheDocument();
  });

  it("removes a suggestion when denied", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    fireEvent.click(within(suggestion).getByRole("button", { name: "Deny" }));

    expect(screen.queryByTestId("architecture-draft-constraints-suggestion")).not.toBeInTheDocument();
    expect(screen.queryByText("EU data residency")).not.toBeInTheDocument();
  });

  it("does not re-suggest a denied constraint on a later suggest pass", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    function StatefulHarness(): React.JSX.Element {
      const [structuredBrief, setStructuredBrief] = useState(emptyArchitectureDraftStructuredBrief());

      return (
        <ArchitectureDraftStructuredBriefFields
          structuredBrief={structuredBrief}
          freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
          onStructuredBriefChange={setStructuredBrief}
        />
      );
    }

    render(<StatefulHarness />);

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));
    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    fireEvent.click(within(suggestion).getByRole("button", { name: "Deny" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-suggest-structured-brief")).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));
    });

    await waitFor(() => {
      expect(mockedDraftArchitectureRequestWithPoll).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByText("EU data residency")).not.toBeInTheDocument();
  });

  it("moves a suggestion into confirmed items when confirmed", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    const suggestion = await screen.findByTestId("architecture-draft-constraints-suggestion");
    fireEvent.click(within(suggestion).getByRole("button", { name: "Confirm" }));

    expect(screen.queryByTestId("architecture-draft-constraints-suggestion")).not.toBeInTheDocument();

    const confirmedRow = screen.getByTestId("architecture-draft-constraints-confirmed");
    expect(within(confirmedRow).getByText("EU data residency")).toBeInTheDocument();
    expect(within(confirmedRow).getByRole("button", { name: "Remove EU data residency" })).toBeInTheDocument();
    expect(confirmedRow.className).not.toMatch(/truncate/);
    expect(confirmedRow.querySelector(".max-w-\\[240px\\]")).toBeNull();
  });

  it("splits multiline LLM suggestion strings into separate confirmable items", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: ["EU data residency\nPrivate networking only\nAudit logging required"],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    expect(await screen.findByText("EU data residency")).toBeInTheDocument();
    expect(screen.getByText("Private networking only")).toBeInTheDocument();
    expect(screen.getByText("Audit logging required")).toBeInTheDocument();
    expect(screen.getAllByTestId("architecture-draft-constraints-suggestion")).toHaveLength(3);
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief-success")).toHaveTextContent(
      "Added 3 suggestions below",
    );
  });

  it("falls back to deterministic suggestions when the API returns no new suggestions", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness
        freeTextIntent={`# Architecture Review Packet\n\n- Availability target is 99.9% for pilot.\n- RPO is 15 minutes; RTO is 4 hours.\n\n### ADR-001: Shared DB with TenantId`}
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    expect(await screen.findByText("Shared DB with TenantId")).toBeInTheDocument();
    expect(screen.getByText("Availability 99.9%")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief-success")).toHaveTextContent(
      "Added 7 suggestions below",
    );
    expect(screen.queryByTestId("architecture-draft-suggest-structured-brief-empty")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when the API returns no new suggestions", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
    });

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    expect(await screen.findByTestId("architecture-draft-suggest-structured-brief-empty")).toHaveTextContent(
      GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY,
    );
  });

  it("labels required capabilities as optional for review readiness", () => {
    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    expect(
      within(screen.getByTestId("architecture-draft-capabilities")).getByText(/^Required capabilities/i),
    ).toHaveTextContent("(optional)");
    expect(screen.queryByText(/Required capabilities.*\(required\)/i)).not.toBeInTheDocument();
  });

  it("labels constraints and assumptions as optional and does not offer Mark unknown", () => {
    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    expect(within(screen.getByTestId("architecture-draft-constraints")).getByText(/Constraints/i)).toHaveTextContent(
      "(optional)",
    );
    expect(within(screen.getByTestId("architecture-draft-assumptions")).getByText(/Assumptions/i)).toHaveTextContent(
      "(optional)",
    );
    expect(screen.queryByRole("button", { name: /Mark unknown/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-constraints-mark-unknown")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-assumptions-mark-unknown")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-capabilities-mark-unknown")).not.toBeInTheDocument();
  });

  it("uses list fields for quality attributes instead of a plain text field", () => {
    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    expect(screen.getByTestId("architecture-draft-quality-attributes")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-quality-attribute")).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("architecture-draft-quality-attributes")).queryByRole("button", {
        name: /Mark unknown/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Numeric targets \(latency, RTO, throughput\)/i)).toBeInTheDocument();
    expect(screen.getByText(/qualitative ones \(defense in depth, zero trust\)/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Quality Attributes/i })).toBeInTheDocument();
  });

  it("renders confirmed items as stacked rows with full text and a labeled Remove button", () => {
    const longConstraint =
      "EU data residency for all customer records including backups and audit logs across every region";

    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        initialBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: [longConstraint],
        }}
      />,
    );

    const confirmedRow = screen.getByTestId("architecture-draft-constraints-confirmed");
    expect(within(confirmedRow).getByText(longConstraint)).toBeInTheDocument();
    expect(within(confirmedRow).getByRole("button", { name: `Remove ${longConstraint}` })).toHaveTextContent(
      "Remove",
    );
    expect(confirmedRow.className).not.toMatch(/truncate/);
    expect(confirmedRow.querySelector(".max-w-\\[240px\\]")).toBeNull();
  });

  it("uses single-line inputs for optional narrative fields", () => {
    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    expect(screen.getByTestId("architecture-draft-failure-mode").tagName).toBe("INPUT");
    expect(screen.getByTestId("architecture-draft-operational-owner").tagName).toBe("INPUT");
  });

  it("adds a confirmed constraint through the full draft form state path", () => {
    function FullFormHarness(): React.JSX.Element {
      const [fields, setFields] = useState({
        freeTextIntent: "Tenant migration platform with private networking and EU residency goals for architecture reviews.",
        businessOutcome: "Reduce cycle time for architecture reviews.",
        systemName: "Vertex",
        structuredBrief: emptyArchitectureDraftStructuredBrief(),
      });

      return (
        <ArchitectureDraftFormFields
          fields={fields}
          actorSet={architectureCreationDefaultActorSet()}
          onFieldsChange={setFields}
          onActorSetChange={() => undefined}
        />
      );
    }

    render(<FullFormHarness />);

    const constraintInput = document.getElementById("architecture-draft-constraints-input");
    expect(constraintInput).not.toBeNull();

    fireEvent.change(constraintInput!, { target: { value: "EU data residency" } });
    fireEvent.click(screen.getByTestId("architecture-draft-constraints-add"));

    const confirmedRow = screen.getByTestId("architecture-draft-constraints-confirmed");
    expect(within(confirmedRow).getByText("EU data residency")).toBeInTheDocument();
    expect(within(confirmedRow).getByRole("button", { name: "Remove EU data residency" })).toBeInTheDocument();
  });

  it("still renders a legacy unknown constraint row so it can be removed", () => {
    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        initialBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        }}
      />,
    );

    const confirmedRow = screen.getByTestId("architecture-draft-constraints-confirmed");
    expect(within(confirmedRow).getByText(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).toBeInTheDocument();

    fireEvent.click(
      within(confirmedRow).getByRole("button", { name: `Remove ${ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL}` }),
    );

    expect(screen.queryByTestId("architecture-draft-constraints-confirmed")).not.toBeInTheDocument();
  });

  it("disables suggest when the monthly AI budget blocks execution", () => {
    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        blocksLlmExecution
      />,
    );

    expect(screen.getByTestId("architecture-draft-suggest-structured-brief")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief-budget-blocked")).toBeInTheDocument();
  });

  it("shows an editor-locked hint when the draft form is disabled", () => {
    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        disabled
      />,
    );

    expect(screen.getByTestId("architecture-draft-suggest-structured-brief")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief-editor-locked-hint")).toBeInTheDocument();
  });

  it("surfaces evidence contradictions for confirmed assumptions after suggest", async () => {
    mockDraftSuggestResponse({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      topologyHints: [],
      securityBaselineHints: [],
      evidenceContradictedAssumptions: [
        {
          assumption: "Single-region pilot",
          evidenceNote: "Overview describes multi-region active-active deployment.",
        },
      ],
    });

    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        initialBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedAssumptions: ["Single-region pilot"],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    expect(
      await screen.findByTestId("architecture-draft-assumptions-evidence-contradiction-notice"),
    ).toHaveTextContent(GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_SECTION);
    expect(screen.getByTestId("architecture-draft-assumptions-evidence-contradiction")).toHaveTextContent(
      "multi-region active-active",
    );
    expectDraftSuggestInput({
      confirmedAssumptions: ["Single-region pilot"],
    });
  });

  it("surfaces API failures inline", async () => {
    mockedDraftArchitectureRequestWithPoll.mockRejectedValue(
      new ApiRequestError("Monthly AI budget exhausted.", {
        problem: null,
        correlationId: null,
        httpStatus: 429,
      }),
    );

    render(
      <StructuredBriefHarness freeTextIntent={"Tenant migration platform with private networking and EU residency goals."} />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-suggest-structured-brief"));

    await waitFor(() => {
      expect(screen.getByText("Monthly AI budget exhausted.")).toBeInTheDocument();
    });
  });
});
