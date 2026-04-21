import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import * as api from "@/lib/api";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { FindingLlmAudit } from "@/types/explanation";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: (): number => AUTHORITY_RANK.ExecuteAuthority,
}));

describe("FindingExplainPanel", () => {
  it("loads redacted LLM audit text", async () => {
    const sample: FindingLlmAudit = {
      traceId: "abc",
      agentType: "Topology",
      systemPromptRedacted: "sys",
      userPromptRedacted: "user",
      rawResponseRedacted: "resp",
      modelDeploymentName: "sim",
      modelVersion: "1",
      redactionCountsByCategory: {},
    };

    const spy = vi.spyOn(api, "getFindingLlmAudit").mockResolvedValue(sample);
    const postSpy = vi.spyOn(api, "postFindingFeedback").mockResolvedValue(undefined);

    render(<FindingExplainPanel runId="run-a" findingId="f-1" />);

    await waitFor(() => {
      expect(screen.getByText(/sys/)).toBeInTheDocument();
    });

    expect(screen.getByText(/user/)).toBeInTheDocument();
    expect(screen.getByText(/resp/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("run-a", "f-1");
    expect(postSpy).not.toHaveBeenCalled();
    spy.mockRestore();
    postSpy.mockRestore();
  });

  it("posts thumbs feedback when Execute rank", async () => {
    const sample: FindingLlmAudit = {
      traceId: "abc",
      agentType: "Topology",
      systemPromptRedacted: "s",
      userPromptRedacted: "u",
      rawResponseRedacted: "r",
      redactionCountsByCategory: {},
    };

    vi.spyOn(api, "getFindingLlmAudit").mockResolvedValue(sample);
    const postSpy = vi.spyOn(api, "postFindingFeedback").mockResolvedValue(undefined);

    render(<FindingExplainPanel runId="run-a" findingId="f-1" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /thumbs up/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /thumbs up/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("run-a", "f-1", 1);
    });

    postSpy.mockRestore();
  });
});
