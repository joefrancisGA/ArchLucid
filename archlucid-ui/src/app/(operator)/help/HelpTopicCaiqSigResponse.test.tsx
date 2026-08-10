import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  computeCaiqSigResponsePostureCounts,
  prepareCaiqSigResponseHelpMarkdown,
} from "@/lib/caiq-sig-response-help-presentation";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView caiq-sig-response", () => {
  const loaded = tryLoadProductDocumentation("caiq-sig-response");

  it("loads CAIQ/SIG documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders claim discipline, Sources links, posture summary, and export caveat", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<CaiqSigResponseHelpEvidenceOrientationStrip />}
        layoutVariant="technicalReference"
        showExportClaimDiscipline
      />,
    );

    expect(screen.getByTestId("caiq-sig-response-help-claim-discipline")).toHaveTextContent(
      CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("help-topic-export-claim-discipline")).toHaveTextContent(
      "not a CPA SOC 2 attestation",
    );

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expect(within(screen.getByTestId("caiq-sig-response-help-sources")).getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }

    expect(screen.getByTestId("caiq-sig-response-help-posture-summary")).toBeInTheDocument();
  });

  it("structures halves with labelled headings and grouped TOC without duplicate Related entries", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);
    const headings = extractHelpMarkdownHeadings(prepared);
    const titles = headings.map((heading) => heading.title);

    expect(prepared).toContain(`## ${CAIQ_SIG_RESPONSE_LITE_PART_HEADING}`);
    expect(prepared).toContain(`## ${CAIQ_SIG_RESPONSE_SIG_PART_HEADING}`);
    expect(titles.filter((title) => title.toLowerCase() === "related")).toHaveLength(0);

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        layoutVariant="technicalReference"
      />,
    );

    const toc = screen.getByTestId("help-topic-toc");

    expect(within(toc).getByText(CAIQ_SIG_RESPONSE_LITE_PART_HEADING)).toBeInTheDocument();
    expect(within(toc).getByText(CAIQ_SIG_RESPONSE_SIG_PART_HEADING)).toBeInTheDocument();
    expect(within(toc).getByRole("link", { name: "Governance (GOV)" })).toHaveAttribute("href", "#governance-gov");
    expect(within(toc).getByRole("link", { name: "SIG Core control families" })).toBeInTheDocument();
  });

  it("renders distinct accessible table captions and StatusTag cells", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} layoutVariant="technicalReference" />);

    const captions = Array.from(document.querySelectorAll("caption"));
    const captionTexts = captions.map((caption) => caption.textContent ?? "");
    const uniqueCaptions = new Set(captionTexts);

    expect(captions.length).toBeGreaterThan(0);
    expect(uniqueCaptions.size).toBe(captionTexts.length);
    expect(captionTexts.some((caption) => caption.includes(CAIQ_SIG_RESPONSE_LITE_PART_HEADING))).toBe(true);
    expect(captionTexts.some((caption) => caption.includes(CAIQ_SIG_RESPONSE_SIG_PART_HEADING))).toBe(true);

    expect(screen.getAllByText("Partial").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Strong").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inherited").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Available under NDA on request").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inherited from cloud provider").length).toBeGreaterThan(0);
  });

  it("reconciles posture summary Strong count with rendered Strong StatusTags outside the summary", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);
    const counts = computeCaiqSigResponsePostureCounts(prepared);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} layoutVariant="technicalReference" />);

    expect(screen.getByTestId("caiq-sig-posture-count-strong")).toHaveTextContent(String(counts.Strong));
    expect(screen.getByTestId("caiq-sig-posture-count-partial")).toHaveTextContent(String(counts.Partial));
    expect(screen.getByTestId("caiq-sig-posture-count-planned")).toHaveTextContent(String(counts.Planned));
    expect(screen.getByTestId("caiq-sig-posture-count-inherited")).toHaveTextContent(String(counts.Inherited));

    const summary = screen.getByTestId("caiq-sig-response-help-posture-summary");
    const strongOutsideSummary = screen
      .getAllByText("Strong")
      .filter((node) => !summary.contains(node));

    expect(strongOutsideSummary).toHaveLength(counts.Strong);
  });

  it("uses the technical reference layout grid for dense questionnaire tables", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        layoutVariant="technicalReference"
      />,
    );

    expect(screen.getByTestId("help-caiq-sig-response-topic")).toHaveClass("max-w-[72rem]");
    expect(screen.getByTestId("help-topic-content").className).toContain("lg:max-w-[52rem]");
  });
});
