import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArtifactListTable } from "./ArtifactListTable";
import { artifactPreviewHref } from "@/lib/artifact-preview-href";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const sample = {
  artifactId: "artifact-guid-1",
  artifactType: "Inventory",
  name: "inventory.json",
  format: "json",
  createdUtc: "2020-01-01T00:00:00Z",
  contentHash: "abcdef123456",
};

describe("ArtifactListTable", () => {
  it("renders sorted artifact names and download links on successful load", () => {
    const artifacts = [
      { ...sample, artifactId: "b", name: "zebra.txt" },
      { ...sample, artifactId: "a", name: "alpha.txt" },
    ];
    render(<ArtifactListTable manifestId="manifest-1" artifacts={artifacts} />);

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(3);

    const links = screen.getAllByRole("link", { name: "Download" });
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toContain("/api/proxy/v1/artifacts/signed-review-records/manifest-1/artifact/");
  });

  it("renders headers with zero data rows when artifact list is empty", () => {
    render(<ArtifactListTable manifestId="manifest-1" artifacts={[]} />);

    expect(screen.getByRole("columnheader", { name: "Artifact" })).toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: "Preview" })).toHaveLength(0);
  });

  it("uses manifest-scoped Preview href when runId is omitted", () => {
    render(<ArtifactListTable manifestId="manifest-1" artifacts={[sample]} />);

    const preview = screen.getByRole("link", { name: "Preview" });
    expect(preview.getAttribute("href")).toBe(signedRecordArtifactPath("manifest-1", "artifact-guid-1"));
  });

  it("uses GAR Preview href when runId is set (product SoT)", () => {
    render(
      <ArtifactListTable manifestId="manifest-1" artifacts={[sample]} runId="run-guid-1" />,
    );

    const preview = screen.getByRole("link", { name: "Preview" });
    expect(preview.getAttribute("href")).toBe(signedRecordArtifactPath("manifest-1", "artifact-guid-1"));
  });

  it("sponsor mode: Output column and role-specific open/download labels; integrity appendix shows fingerprints", () => {
    const mimeSample = {
      ...sample,
      format: "text/markdown",
      name: "brief.md",
      artifactType: "MarkdownReport",
    };
    render(
      <ArtifactListTable manifestId="manifest-1" artifacts={[mimeSample]} sponsorMode />,
    );

    expect(screen.getByRole("columnheader", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Generated" })).toBeInTheDocument();
    const deliverableTables = screen.getAllByRole("table");
    expect(deliverableTables[0]).toHaveClass("table-fixed");
    expect(screen.getByRole("link", { name: "Open executive briefing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download executive briefing" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Format" })).toBeNull();

    expect(screen.getByText(/Integrity fingerprints/)).toBeInTheDocument();
    expect(screen.getByText("SHA-256")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy fingerprint for Executive briefing/i })).toBeInTheDocument();
  });

  it("sponsor mode with audienceSections groups rows under ordered audience headings", () => {
    const artifacts = [
      { ...sample, artifactId: "ev", artifactType: "EvidenceBundle", name: "ev.zip" },
      {
        ...sample,
        artifactId: "md",
        artifactType: "MarkdownReport",
        name: "b.md",
        format: "text/markdown",
      },
      { ...sample, artifactId: "jb", artifactType: "JsonBundle", name: "decisions.json" },
      { ...sample, artifactId: "cs", artifactType: "CostSummary", name: "cost.json" },
    ];
    render(
      <ArtifactListTable
        manifestId="manifest-1"
        artifacts={artifacts}
        sponsorMode
        audienceSections
      />,
    );

    expect(
      screen.getByRole("region", { name: "Deliverables grouped by audience" }),
    ).toBeInTheDocument();

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Executive briefing",
      "Executive & architecture",
      "Architecture review board",
      "Audit & compliance",
    ]);
  });

  it("sponsor mode with audienceSections keeps run-scoped preview links when runId is set", () => {
    const artifacts = [
      {
        ...sample,
        artifactId: "md",
        artifactType: "MarkdownReport",
        name: "b.md",
        format: "text/markdown",
      },
    ];
    render(
      <ArtifactListTable
        manifestId="manifest-1"
        artifacts={artifacts}
        runId="run-guid-1"
        sponsorMode
        audienceSections
      />,
    );

    const preview = screen.getByRole("link", { name: "Open executive briefing" });
    expect(preview.getAttribute("href")).toBe(signedRecordArtifactPath("manifest-1", "md"));
  });

  it("sponsor mode: omits redundant filename caption when stem aligns with business label", () => {
    const row = {
      artifactId: "artifact-guid-md",
      artifactType: "MarkdownReport",
      name: "Executive briefing — Claims Intake Modernization.md",
      format: "text/markdown",
      createdUtc: "2020-01-01T00:00:00Z",
      contentHash: "abcdef123456",
    };
    render(<ArtifactListTable manifestId="manifest-1" artifacts={[row]} sponsorMode />);

    expect(screen.queryByText("Executive briefing — Claims Intake Modernization")).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Output" })).toBeInTheDocument();
  });

  it("sponsor mode with audienceSections limits buckets when deliverablesBucketAllowlist is set", () => {
    const artifacts = [
      { ...sample, artifactId: "ev", artifactType: "EvidenceBundle", name: "ev.zip" },
      {
        ...sample,
        artifactId: "md",
        artifactType: "MarkdownReport",
        name: "b.md",
        format: "text/markdown",
      },
      { ...sample, artifactId: "jb", artifactType: "JsonBundle", name: "decisions.json" },
    ];
    render(
      <ArtifactListTable
        manifestId="manifest-1"
        artifacts={artifacts}
        sponsorMode
        audienceSections
        deliverablesBucketAllowlist={["sponsor", "shared"]}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Architecture review board" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Audit & compliance" })).toBeNull();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Executive briefing"]);
  });
});
