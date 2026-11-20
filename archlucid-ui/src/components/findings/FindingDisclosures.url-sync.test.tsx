import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { FindingCorrelationVocabularyDisambiguation } from "@/components/findings/FindingCorrelationVocabularyDisambiguation";
import { FindingInspectJsonPayload } from "@/components/findings/FindingInspectJsonPayload";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";

vi.mock("next/navigation", () => ({ usePathname: () => "/findings" }));

afterEach(() => window.history.replaceState(null, "", "/"));

it.each([
  {
    param: "findingCorrelationVocabularyOpen",
    panel: <FindingCorrelationVocabularyDisambiguation />,
    summary: /three different/i,
  },
  {
    param: "findingInspectTypedPayloadOpen",
    panel: <FindingInspectJsonPayload value={{ status: "ready" }} />,
    summary: /typed finding payload json/i,
  },
  {
    param: "findingOptionalArtifactTechnicalDetailsOpen",
    panel: <FindingOptionalArtifactUnavailable heading="Audit unavailable" body="No record attached." failure={{ message: "Not found", httpStatus: 404, correlationId: "test-id" }} />,
    summary: /technical details/i,
  },
  {
    param: "findingSponsorPlainEnglishOpen",
    panel: <SponsorPlainEnglishFindingPanel input={{ title: "Ingress", message: "Review required.", severity: "High" }} />,
    summary: /explain for a sponsor/i,
  },
])("restores the $param disclosure from the URL and honors an actual close", ({ param, panel, summary }) => {
  window.history.replaceState(null, "", `/findings?${param}=1`);
  render(panel);

  const details = screen.getByText(summary, { selector: "summary" }).closest("details")!;
  expect(details.open).toBe(true);
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(true);
  expect(new URLSearchParams(window.location.search).get(param)).toBe("1");

  details.open = false;
  fireEvent(details, new Event("toggle"));
  expect(details.open).toBe(false);
  expect(new URLSearchParams(window.location.search).has(param)).toBe(false);
});
