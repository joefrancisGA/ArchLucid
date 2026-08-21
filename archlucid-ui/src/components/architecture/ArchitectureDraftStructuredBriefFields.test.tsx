import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { ArchitectureDraftStructuredBriefFields } from "@/components/architecture/ArchitectureDraftStructuredBriefFields";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { draftArchitectureRequest } from "@/lib/api/architecture-request-draft-api";
import { ApiRequestError } from "@/lib/api-request-error";
import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  emptyArchitectureDraftStructuredBrief,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY } from "@/lib/guided-intake-copy";

vi.mock("@/lib/api/architecture-request-draft-api", () => ({
  ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS: 20,
  draftArchitectureRequest: vi.fn(),
}));

const mockedDraftArchitectureRequest = vi.mocked(draftArchitectureRequest);

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
  it("shows suggested chips after a successful suggest call", async () => {
    mockedDraftArchitectureRequest.mockResolvedValue({
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
    expect(mockedDraftArchitectureRequest).toHaveBeenCalledWith({
      freeTextDescription:
        "Tenant migration platform with private networking and EU residency goals.",
    });
  });

  it("shows an empty-state message when the API returns no new suggestions", async () => {
    mockedDraftArchitectureRequest.mockResolvedValue({
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

  it("uses chip lists for quality attributes instead of a plain text field", () => {
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

    expect(screen.getByText("EU data residency")).toBeInTheDocument();
  });

  it("still renders a legacy unknown constraint chip so it can be removed", () => {
    render(
      <StructuredBriefHarness
        freeTextIntent={"Tenant migration platform with private networking and EU residency goals."}
        initialBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
        }}
      />,
    );

    expect(screen.getByText(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: `Remove ${ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL}` }),
    );

    expect(screen.queryByText(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).not.toBeInTheDocument();
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

  it("surfaces API failures inline", async () => {
    mockedDraftArchitectureRequest.mockRejectedValue(
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
