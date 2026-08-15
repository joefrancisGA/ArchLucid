import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ArchitectureNarrativeMarkdownView,
  readArchitectureNarrativeRenderDiagnostic,
} from "@/components/architecture/ArchitectureNarrativeMarkdownView";

const representativeNarrative = `## Sponsor report

Governed claims intake for enterprise analysts.

## Systems and services

| Service | Role |
| --- | --- |
| Claims API | Edge integration |
| Evidence store | Audit trail |

## Risks

- Partner outage during month-end close

## Implementation notes

\`\`\`typescript
const timeoutMs = 30_000;
const endpoint = "https://claims.example.internal/v1/intake";
\`\`\`

See [operator help](/help/first-architecture-review) and reject \`javascript:alert(1)\` links.`;

describe("ArchitectureNarrativeMarkdownView", () => {
  it("renders headings, paragraphs, lists, tables, and code without raw markdown tokens", () => {
    const { container } = render(<ArchitectureNarrativeMarkdownView markdown={representativeNarrative} />);

    expect(screen.getByRole("heading", { level: 2, name: "Sponsor report" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Systems and services" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Claims API")).toBeInTheDocument();
    expect(screen.getByText("Partner outage during month-end close")).toBeInTheDocument();
    expect(screen.getByText(/const timeoutMs = 30_000;/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "operator help" })).toHaveAttribute("href", "/help/first-architecture-review");

    const visibleText = container.textContent ?? "";
    expect(visibleText).not.toMatch(/^\s*##\s/m);
    expect(visibleText).not.toContain("| --- |");
    expect(visibleText).not.toContain("```typescript");

    expect(container).toMatchSnapshot();
  });

  it("normalizes escaped newlines before rendering", () => {
    render(
      <ArchitectureNarrativeMarkdownView markdown={"## Scope\\n\\nSupport **Entra ID** sign-in."} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Scope" })).toBeInTheDocument();
    expect(screen.getByText("Entra ID")).toBeInTheDocument();
  });

  it("removes unsafe scripts and blocks unsafe links", () => {
    render(
      <ArchitectureNarrativeMarkdownView
        markdown={'## Assumptions\n\n<script>alert("xss")</script>\n\n[Bad](javascript:alert(1))'}
      />,
    );

    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    expect(screen.getByText("Bad")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bad" })).toBeNull();
  });

  it("uses plain-text fallback for JSON payloads", () => {
    render(<ArchitectureNarrativeMarkdownView markdown='{"narrative":"## Heading"}' />);

    expect(screen.getByTestId("architecture-narrative-plain-fallback")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Heading" })).toBeNull();
    expect(readArchitectureNarrativeRenderDiagnostic()?.reason).toBe("plain-fallback");
  });

  it("shows an empty state message for blank narratives", () => {
    render(
      <ArchitectureNarrativeMarkdownView
        markdown="   "
        emptyStateMessage="No architecture narrative is available yet."
      />,
    );

    expect(screen.getByText("No architecture narrative is available yet.")).toBeInTheDocument();
    expect(readArchitectureNarrativeRenderDiagnostic()?.reason).toBe("empty");
  });

  it("wraps long code and urls without breaking layout classes", () => {
    const { container } = render(
      <ArchitectureNarrativeMarkdownView
        markdown={
          "## Links\n\nRead [internal runbook](https://example.internal/very/long/path/that/should/wrap/or/scroll/safely/in/the/reading/column/without/overflowing/the/page/layout/edge/to/edge/for/operators/on/narrow/viewports)."
        }
      />,
    );

    const view = screen.getByTestId("architecture-narrative-markdown-view");
    expect(view.className).toContain("max-w-3xl");
    expect(view.className).toContain("[&_a]:break-words");
    expect(container.querySelector("a[href^='https://example.internal']")).toBeInTheDocument();
  });
});
