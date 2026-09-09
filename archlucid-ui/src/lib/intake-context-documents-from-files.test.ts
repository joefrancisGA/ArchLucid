import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";
import { buildIntakeContextDocumentsFromEvidenceFiles } from "@/lib/intake-context-documents-from-files";

vi.mock("@/lib/extract-evidence-document-text", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/extract-evidence-document-text")>();

  return {
    ...actual,
    extractEvidenceDocumentText: vi.fn(),
  };
});

const mockedExtract = vi.mocked(extractEvidenceDocumentText);

describe("buildIntakeContextDocumentsFromEvidenceFiles", () => {
  beforeEach(() => {
    mockedExtract.mockReset();
  });

  it("sends extracted Word text as text/plain under the original file name", async () => {
    mockedExtract.mockResolvedValue({
      ok: true,
      text: "Azure App Service behind Front Door with private endpoints.",
      truncated: false,
    });

    const file = new File(["binary"], "ARCHITECTURE_HANDBOOK.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "ARCHITECTURE_HANDBOOK.docx",
        contentType: "text/plain",
        content: "Azure App Service behind Front Door with private endpoints.",
      },
    ]);
  });

  it("includes markdown attachments as text/markdown", async () => {
    const file = new File(["# Brief\n\nMulti-tenant SaaS on Azure."], "architecture-brief.md", {
      type: "text/markdown",
    });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "architecture-brief.md",
        contentType: "text/markdown",
        content: "# Brief\n\nMulti-tenant SaaS on Azure.",
      },
    ]);
    expect(mockedExtract).not.toHaveBeenCalled();
  });

  it("classifies markdown content type from trimmed file names", async () => {
    const file = new File(["# Brief"], "brief.md ", {
      type: "text/markdown",
    });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "brief.md",
        contentType: "text/markdown",
        content: "# Brief",
      },
    ]);
  });

  it("includes mermaid .mmd attachments as text/vnd.mermaid", async () => {
    const file = new File(
      [
        'flowchart LR\n  api["API Gateway"]\n  db["SQL Database"]\n  api -->|"queries"| db',
      ],
      "topology.mmd",
      { type: "text/plain" },
    );
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "topology.mmd",
        contentType: "text/vnd.mermaid",
        content: 'flowchart LR\n  api["API Gateway"]\n  db["SQL Database"]\n  api -->|"queries"| db',
      },
    ]);
  });

  it("classifies mermaid-looking plain text as text/vnd.mermaid", async () => {
    const file = new File(
      ['flowchart TB\n  web["Web app"]\n  sql["Database"]\n  web --> sql'],
      "diagram.txt",
      { type: "text/plain" },
    );
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents[0]?.contentType).toBe("text/vnd.mermaid");
    expect(documents[0]?.name).toBe("diagram.txt");
  });

  it("includes svg attachments as application/vnd.archlucid.diagram+svg", async () => {
    const file = new File(
      [
        '<svg xmlns="http://www.w3.org/2000/svg"><g id="api"><rect x="0" y="0" width="10" height="10"/><text>API</text></g></svg>',
      ],
      "topology.svg",
      { type: "image/svg+xml" },
    );
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "topology.svg",
        contentType: "application/vnd.archlucid.diagram+svg",
        content:
          '<svg xmlns="http://www.w3.org/2000/svg"><g id="api"><rect x="0" y="0" width="10" height="10"/><text>API</text></g></svg>',
      },
    ]);
  });

  it("includes draw.io attachments as application/vnd.jgraph.mxfile", async () => {
    const drawIo = `<mxfile host="app.diagrams.net"><diagram id="page-1" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="API Gateway" vertex="1" parent="1"/></root></mxGraphModel></diagram></mxfile>`;
    const file = new File([drawIo], "topology.drawio", { type: "application/xml" });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "topology.drawio",
        contentType: "application/vnd.jgraph.mxfile",
        content: drawIo,
      },
    ]);
  });

  it("includes native diagram JSON as application/vnd.archlucid.diagram+json", async () => {
    const diagramJson = JSON.stringify({
      nodes: [
        { id: "api", label: "API Gateway", kind: "system" },
        { id: "db", label: "SQL Database", kind: "system" },
      ],
      edges: [{ id: "e1", sourceId: "api", targetId: "db", label: "queries" }],
      trustBoundaryLabels: [],
      extractionMethod: "StructuredParse",
    });
    const file = new File([diagramJson], "topology.diagram.json", { type: "application/json" });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "topology.diagram.json",
        contentType: "application/vnd.archlucid.diagram+json",
        content: diagramJson,
      },
    ]);
  });

  it("classifies diagram-shaped .json attachments as structured diagram JSON", async () => {
    const diagramJson = JSON.stringify({
      nodes: [{ id: "web", label: "Web app", kind: "system" }],
      edges: [],
      trustBoundaryLabels: [],
    });
    const file = new File([diagramJson], "topology.json", { type: "application/json" });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents[0]?.contentType).toBe("application/vnd.archlucid.diagram+json");
    expect(documents[0]?.name).toBe("topology.json");
  });

  it("keeps unrelated JSON as text/plain", async () => {
    const manifestJson = JSON.stringify({ resources: [{ type: "Microsoft.Storage/storageAccounts" }] });
    const file = new File([manifestJson], "manifest.json", { type: "application/json" });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "manifest.json",
        contentType: "text/plain",
        content: manifestJson,
      },
    ]);
  });

  it("emits a NotVerifiable diagram stub for PNG and skips failed docx extract", async () => {
    mockedExtract.mockResolvedValue({
      ok: false,
      message: "Could not extract text from the uploaded document.",
    });

    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
      new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" }),
      new File(["binary"], "empty.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ]);

    expect(documents).toHaveLength(1);
    expect(documents[0]?.name).toBe("photo.png");
    expect(documents[0]?.contentType).toBe("application/vnd.archlucid.diagram+json");
    expect(documents[0]?.content).toMatch(/"verificationStatus":"NotVerifiable"/);
    expect(mockedExtract).toHaveBeenCalledTimes(1);
  });
});
