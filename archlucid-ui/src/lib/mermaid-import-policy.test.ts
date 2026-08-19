import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const MERMAID_DYNAMIC_IMPORTERS = [
  join(SRC_ROOT, "components", "architecture", "ArchitectureDiagramViewer.tsx"),
  join(SRC_ROOT, "components", "help", "MermaidDiagram.tsx"),
] as const;

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

function filesDynamicallyImportingMermaid(sourceFiles: string[]): string[] {
  return sourceFiles.filter((filePath) => {
    const source = readFileSync(filePath, "utf8");

    return /import\(["']mermaid["']\)/.test(source);
  });
}

function filesStaticallyImportingMermaid(sourceFiles: string[]): string[] {
  return sourceFiles.filter((filePath) => {
    const source = readFileSync(filePath, "utf8");

    return /from\s+["']mermaid["']/.test(source);
  });
}

describe("mermaid import policy (TB-863)", () => {
  it("dynamically imports mermaid only from the known diagram renderer modules", () => {
    const mermaidImporters = filesDynamicallyImportingMermaid(collectSourceFiles(SRC_ROOT));

    expect(mermaidImporters.sort()).toEqual([...MERMAID_DYNAMIC_IMPORTERS].sort());
  });

  it("does not statically import mermaid anywhere in src", () => {
    const staticImporters = filesStaticallyImportingMermaid(collectSourceFiles(SRC_ROOT));

    expect(staticImporters).toEqual([]);
  });

  it("loads architecture diagrams through a deferred run-detail chunk", () => {
    const pageViewSource = readFileSync(
      join(SRC_ROOT, "app", "(operator)", "architecture", "reviews", "[reviewId]", "_sections", "RunDetailPageView.tsx"),
      "utf8",
    );
    const deferredChunksSource = readFileSync(
      join(
        SRC_ROOT,
        "app",
        "(operator)",
        "architecture",
        "reviews",
        "[reviewId]",
        "_sections",
        "run-detail-page-view-deferred-chunks.tsx",
      ),
      "utf8",
    );
    const diagramPanelSource = readFileSync(
      join(SRC_ROOT, "components", "architecture", "ArchitectureDiagramPanel.tsx"),
      "utf8",
    );

    expect(pageViewSource).toContain("RunDetailArchitectureCreatedWorkspaceDeferred");
    expect(pageViewSource).not.toContain('import("@/components/architecture/ArchitectureCreatedWorkspace")');
    expect(deferredChunksSource).toContain("dynamic(");
    expect(deferredChunksSource).toContain('import("@/components/architecture/ArchitectureCreatedWorkspace")');
    expect(diagramPanelSource).toContain("ArchitectureDiagramViewer");
  });

  it("renders help mermaid through MermaidDiagram inside the markdown fragment", () => {
    const markdownFragmentSource = readFileSync(
      join(SRC_ROOT, "components", "marketing", "MarketingAccessibilityMarkdownFragment.tsx"),
      "utf8",
    );
    const helpTopicViewSource = readFileSync(
      join(SRC_ROOT, "app", "(operator)", "help", "HelpTopicMarkdownView.tsx"),
      "utf8",
    );

    expect(markdownFragmentSource).toContain('from "@/components/help/MermaidDiagram"');
    expect(markdownFragmentSource).toContain("<MermaidDiagram");
    expect(helpTopicViewSource).toContain("MarketingAccessibilityMarkdownFragment");
    expect(helpTopicViewSource).not.toMatch(/import\(["']mermaid["']\)/);
  });

  it("does not import mermaid on operator home or reviews entry routes", () => {
    const hotPathModules = [
      join(SRC_ROOT, "app", "(operator)", "_sections", "OperatorHomePageView.tsx"),
      join(SRC_ROOT, "app", "(operator)", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "architecture", "reviews", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "architecture", "reviews", "[reviewId]", "page.tsx"),
    ];

    for (const modulePath of hotPathModules) {
      const source = readFileSync(modulePath, "utf8");

      expect(source).not.toMatch(/from\s+["']mermaid["']/);
      expect(source).not.toMatch(/import\(["']mermaid["']\)/);
    }
  });
});
