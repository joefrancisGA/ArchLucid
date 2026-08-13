import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/caiq-sig-response",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
}));

import { HelpCaiqSigResponseGuideView } from "@/app/(operator)/help/_sections/HelpCaiqSigResponseGuideView";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import {
  CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID,
  CAIQ_SIG_RESPONSE_HELP_JOB_MATRIX_HEADING,
  CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE,
  CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS,
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY,
  CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID,
  splitCaiqSigPreparedMarkdown,
} from "@/lib/caiq-sig-response-help-guide-content";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  computeCaiqSigResponsePostureCounts,
  countCaiqSigResponseTableRows,
  prepareCaiqSigResponseHelpMarkdown,
  sumCaiqSigResponsePostureCounts,
} from "@/lib/caiq-sig-response-help-presentation";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpCaiqSigResponseGuideView (TB-1631)", () => {
  const loaded = tryLoadProductDocumentation("caiq-sig-response");

  it("loads CAIQ/SIG documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders specialty guide chrome with diligence CTAs, job split, and posture summary", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("caiq-sig-response-help-lead")).toHaveTextContent(CAIQ_SIG_RESPONSE_HELP_LEAD);
    expect(screen.getByRole("heading", { name: CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("caiq-sig-response-help-claim-discipline")).toHaveTextContent(
      CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
    );

    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.testId)).toHaveAttribute(
      "href",
      CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openTrustCenter.href,
    );
    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openComplianceJourney.testId)).toHaveAttribute(
      "href",
      CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.openComplianceJourney.href,
    );
    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.requestDiligencePack.testId)).toHaveAttribute(
      "href",
      CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS.requestDiligencePack.href,
    );

    expect(screen.getByRole("heading", { name: CAIQ_SIG_RESPONSE_HELP_JOB_MATRIX_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CAIQ_SIG_RESPONSE_LITE_PART_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CAIQ_SIG_RESPONSE_SIG_PART_HEADING })).toBeInTheDocument();

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      const sourceLink = within(screen.getByTestId("caiq-sig-response-help-sources")).getByRole("link", {
        name: link.label,
      });
      expect(sourceLink).toHaveAttribute("href", link.href);
      expect(screen.getByText(link.when)).toBeInTheDocument();
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

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    expect(within(toc).getByText(CAIQ_SIG_RESPONSE_LITE_PART_HEADING)).toBeInTheDocument();
    expect(within(toc).getByText(CAIQ_SIG_RESPONSE_SIG_PART_HEADING)).toBeInTheDocument();
    expect(within(toc).getByRole("link", { name: "Governance (GOV)" })).toHaveAttribute("href", "#governance-gov");
    expect(within(toc).getByRole("link", { name: "SIG Core control families" })).toBeInTheDocument();
  });

  it("renders distinct accessible table captions, StatusTag cells, and CAIQ answer narratives", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const captions = Array.from(document.querySelectorAll("caption"));
    const captionTexts = captions.map((caption) => caption.textContent ?? "");
    const uniqueCaptions = new Set(captionTexts);

    expect(captions.length).toBeGreaterThan(0);
    expect(uniqueCaptions.size).toBe(captionTexts.length);
    expect(captionTexts.some((caption) => caption.includes(CAIQ_SIG_RESPONSE_SIG_PART_HEADING))).toBe(false);

    expect(screen.getAllByText("Partial").length).toBeGreaterThan(0);
    expect(screen.getByText(/TLS to API/i)).toBeInTheDocument();
    expect(screen.getByText(/annual engineering briefing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CodeQL/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/policy-based/i)).toBeInTheDocument();
    expect(screen.getAllByText("Available under NDA on request").length).toBeGreaterThan(0);
  });

  it("reconciles posture summary counts with rendered chips outside the summary", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const prepared = prepareCaiqSigResponseHelpMarkdown(loaded.markdown, sourcePath);
    const counts = computeCaiqSigResponsePostureCounts(prepared);
    const tableRowTotal = countCaiqSigResponseTableRows(prepared);
    const liteCounts = computeCaiqSigResponsePostureCounts(splitCaiqSigPreparedMarkdown(prepared).liteMarkdown);

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("caiq-sig-posture-count-affirmative")).toHaveTextContent(String(counts.Affirmative));
    expect(screen.getByTestId("caiq-sig-posture-count-strong")).toHaveTextContent(String(counts.Strong));
    expect(screen.getByTestId("caiq-sig-posture-count-partial")).toHaveTextContent(String(counts.Partial));
    expect(screen.getByTestId("caiq-sig-posture-count-planned")).toHaveTextContent(String(counts.Planned));
    expect(screen.getByTestId("caiq-sig-posture-count-inherited")).toHaveTextContent(String(counts.Inherited));
    expect(sumCaiqSigResponsePostureCounts(counts)).toBe(tableRowTotal);

    const summary = screen.getByTestId("caiq-sig-response-help-posture-summary");

    const chipLabels = [
      { count: liteCounts.Affirmative, label: "Yes" },
      { count: liteCounts.Strong, label: "Strong" },
      { count: liteCounts.Partial, label: "Partial" },
      { count: liteCounts.Planned, label: "Planned" },
      { count: liteCounts.Inherited, label: "Inherited" },
    ] as const;

    for (const chip of chipLabels) {
      if (chip.count === 0) {
        continue;
      }

      const outsideSummary = screen.getAllByText(chip.label).filter((node) => !summary.contains(node));
      expect(outsideSummary).toHaveLength(chip.count);
    }
  });

  it("uses the technical reference layout grid for dense questionnaire tables", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID)).toHaveClass("max-w-[72rem]");
    expect(screen.getByTestId("help-topic-content").className).toContain("lg:max-w-[52rem]");
  });

  it("keeps SIG tables out of the first viewport until expanded (TB-1634)", () => {
    if (loaded === null) {
      throw new Error("Expected caiq-sig-response documentation to load.");
    }

    render(<HelpCaiqSigResponseGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId(CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID)).toHaveTextContent(
      CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY,
    );
    expect(screen.queryByTestId("help-caiq-sig-response-sig-deferred-body")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Family" })).not.toBeInTheDocument();
  });
});
