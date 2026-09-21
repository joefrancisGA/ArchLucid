import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceOutlineEdgeToLabel,
  resolveInfraEvidenceOutlineEdgeToDisplay,
} from "@/lib/infra-evidence/format-infra-evidence-outline-edge-to-label";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

describe("formatInfraEvidenceOutlineEdgeToLabel", () => {
  it("keeps the To name when From and To differ", () => {
    expect(
      formatInfraEvidenceOutlineEdgeToLabel({
        fromName: "cosmos-sql-account-pe",
        toName: "cosmos-sql-account",
        toResourceType: "Microsoft.DocumentDB/databaseAccounts",
      }),
    ).toBe("cosmos-sql-account");
  });

  it("appends the To resource type when names match", () => {
    expect(
      formatInfraEvidenceOutlineEdgeToLabel({
        fromName: "cosmos-sql-account",
        toName: "cosmos-sql-account",
        toResourceType: "Microsoft.DocumentDB/databaseAccounts",
      }),
    ).toBe("cosmos-sql-account (Cosmos DB)");
  });

  it("matches names case-insensitively", () => {
    expect(
      formatInfraEvidenceOutlineEdgeToLabel({
        fromName: "SQL-MI",
        toName: "sql-mi",
        toResourceType: "Microsoft.Sql/managedInstances",
      }),
    ).toBe("sql-mi (SQL Managed Instance)");
  });

  it("does not append when the To type is missing", () => {
    expect(
      formatInfraEvidenceOutlineEdgeToLabel({
        fromName: "sql-mi",
        toName: "sql-mi",
        toResourceType: null,
      }),
    ).toBe("sql-mi");
  });

  it("does not double-append a type that is already in the To name", () => {
    expect(
      formatInfraEvidenceOutlineEdgeToLabel({
        fromName: "core-vnet (Virtual Network)",
        toName: "core-vnet (Virtual Network)",
        toResourceType: "Microsoft.Network/virtualNetworks",
      }),
    ).toBe("core-vnet (Virtual Network)");
  });
});

describe("resolveInfraEvidenceOutlineEdgeToDisplay", () => {
  it("strips mermaid type captions then re-appends the To type when names collide", () => {
    const fromNode: InfraEvidenceMermaidOutlineNode = {
      id: "n_pe",
      label: "cosmos-sql-account (Private endpoint)",
      resourceType: "Microsoft.Network/privateEndpoints",
      resourceGroup: "rg-network",
    };
    const toNode: InfraEvidenceMermaidOutlineNode = {
      id: "n_cosmos",
      label: "cosmos-sql-account (Cosmos DB)",
      resourceType: "Microsoft.DocumentDB/databaseAccounts",
      resourceGroup: "rg-data",
    };

    expect(
      resolveInfraEvidenceOutlineEdgeToDisplay({
        fromNode,
        toNode,
        fromFallback: "n_pe",
        toFallback: "n_cosmos",
      }),
    ).toBe("cosmos-sql-account (Cosmos DB)");
  });

  it("uses fallbacks when outline nodes are missing", () => {
    expect(
      resolveInfraEvidenceOutlineEdgeToDisplay({
        fromNode: undefined,
        toNode: undefined,
        fromFallback: "n_src",
        toFallback: "n_missing",
      }),
    ).toBe("n_missing");
  });
});
