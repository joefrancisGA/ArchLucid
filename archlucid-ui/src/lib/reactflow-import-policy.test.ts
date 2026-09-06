import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const REACTFLOW_RUNTIME_IMPORTERS = [
  join(SRC_ROOT, "components", "GraphViewer.tsx"),
  join(SRC_ROOT, "components", "GraphViewerReactFlowTriggers.tsx"),
  join(SRC_ROOT, "components", "findings", "FindingEvidenceGraph.tsx"),
] as const;

const REACTFLOW_TYPE_ONLY_IMPORTERS = [
  join(SRC_ROOT, "lib", "findings", "finding-evidence-graph-highlight.ts"),
  join(SRC_ROOT, "lib", "graph-mapper.ts"),
  join(SRC_ROOT, "lib", "graph-selection-highlight.ts"),
  join(SRC_ROOT, "lib", "graph-selection-highlight.test.ts"),
  join(SRC_ROOT, "lib", "workers", "inp-offload-contract.ts"),
  join(SRC_ROOT, "lib", "workers", "inp-offload-tasks.ts"),
] as const;

const REACTFLOW_IMPORTERS = [...REACTFLOW_RUNTIME_IMPORTERS, ...REACTFLOW_TYPE_ONLY_IMPORTERS] as const;

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

function filesImportingReactflow(sourceFiles: string[]): string[] {
  return sourceFiles.filter((filePath) => {
    const source = readFileSync(filePath, "utf8");

    return /from\s+["']reactflow["']/.test(source);
  });
}

describe("reactflow import policy (TB-862)", () => {
  it("imports reactflow only from the known graph viewer modules and type-only helpers", () => {
    const reactflowImporters = filesImportingReactflow(collectSourceFiles(SRC_ROOT));

    expect(reactflowImporters.sort()).toEqual([...REACTFLOW_IMPORTERS].sort());
  });

  it("loads GraphViewer through dynamic imports on graph surfaces", () => {
    const graphCanvasSource = readFileSync(
      join(SRC_ROOT, "app", "(operator)", "insights", "evidence-graph", "_sections", "GraphInteractiveCanvas.tsx"),
      "utf8",
    );
    const architectureGraphSource = readFileSync(
      join(SRC_ROOT, "components", "ArchitectureGraphViewer.tsx"),
      "utf8",
    );

    expect(graphCanvasSource).toContain("dynamic(");
    expect(graphCanvasSource).toContain('import("@/components/GraphViewer")');
    expect(architectureGraphSource).toContain("dynamic(");
    expect(architectureGraphSource).toContain('import("@/components/GraphViewer")');
  });

  it("loads FindingEvidenceGraph through a dynamic import wrapper", () => {
    const lazyWrapperSource = readFileSync(
      join(SRC_ROOT, "components", "findings", "FindingEvidenceGraphLazy.tsx"),
      "utf8",
    );
    const explainabilityDialogSource = readFileSync(
      join(SRC_ROOT, "components", "findings", "FindingExplainabilityDialog.tsx"),
      "utf8",
    );

    expect(lazyWrapperSource).toContain("dynamic(");
    expect(lazyWrapperSource).toContain('import("./FindingEvidenceGraph")');
    expect(explainabilityDialogSource).toContain("FindingEvidenceGraphLazy");
    expect(explainabilityDialogSource).not.toContain('from "./FindingEvidenceGraph"');
    expect(explainabilityDialogSource).not.toContain('from "@/components/findings/FindingEvidenceGraph"');
  });

  it("does not statically import reactflow on operator home or reviews entry routes", () => {
    const hotPathModules = [
      join(SRC_ROOT, "app", "(operator)", "_sections", "OperatorHomePageView.tsx"),
      join(SRC_ROOT, "app", "(operator)", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "architecture", "reviews", "page.tsx"),
      join(SRC_ROOT, "app", "(operator)", "architecture", "reviews", "[reviewId]", "page.tsx"),
    ];

    for (const modulePath of hotPathModules) {
      const source = readFileSync(modulePath, "utf8");

      expect(source).not.toMatch(/from\s+["']reactflow["']/);
    }
  });
});
