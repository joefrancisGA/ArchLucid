namespace ArchLucid.Architecture.Tests;

/// <summary>
///     <c>*.csproj</c> <c>ProjectReference</c> rules, keyed by the rule sentence that appears in CI output.
///     These catch build-graph regressions before any code consumes the new edge.
/// </summary>
internal static class ArchitectureProjectReferenceConstraintManifest
{
    internal static readonly IReadOnlyDictionary<string, ProjectReferenceConstraint> Rules = Build();

    internal static ProjectReferenceConstraint Rule(string ruleName)
        => ArchitectureConstraintManifestLookup.Rule(Rules, ruleName);

    private static IReadOnlyDictionary<string, ProjectReferenceConstraint> Build()
    {
        Dictionary<string, ProjectReferenceConstraint> rules = new(StringComparer.Ordinal)
        {
            ["ArtifactSynthesis csproj references Decisioning by design"] = new(
                "ArchLucid.ArtifactSynthesis",
                ["ArchLucid.Decisioning"],
                ArchitectureReferenceExpectation.Required,
                "TB-031 Option A: ArtifactSynthesis consumes Decisioning types; Decisioning must not reference ArtifactSynthesis."),

            ["Capabilities.Cost csproj must not reference AgentSimulator"] = new(
                "ArchLucid.Capabilities.Cost",
                ["ArchLucid.AgentSimulator"],
                ArchitectureReferenceExpectation.Forbidden,
                "TB-027: Capabilities.Cost uses Core.FakeScenarioFactory; AgentSimulator is composition-root only."),

            ["Host.Core csproj must not reference AgentSimulator"] = new(
                "ArchLucid.Host.Core",
                ["ArchLucid.AgentSimulator"],
                ArchitectureReferenceExpectation.Forbidden,
                "TB-027: simulator wiring belongs in Host.Composition only."),

            ["Mcp csproj must not reference Application, Persistence, or Retrieval"] = new(
                "ArchLucid.Mcp",
                ["ArchLucid.Application", "ArchLucid.Persistence", "ArchLucid.Retrieval"],
                ArchitectureReferenceExpectation.Forbidden,
                "TB-032: Mcp depends on Core retrieval ports, not on Application, Persistence, or the Retrieval implementation assembly."),

            ["Integrations.AzureExtractor csproj must not reference Application"] = new(
                "ArchLucid.Integrations.AzureExtractor",
                ["ArchLucid.Application"],
                ArchitectureReferenceExpectation.Forbidden,
                "ArchLucid.Integrations.AzureExtractor must not declare a ProjectReference to Application."),

            ["Integrations.AzureDevOps csproj must not reference Application"] = new(
                "ArchLucid.Integrations.AzureDevOps",
                ["ArchLucid.Application"],
                ArchitectureReferenceExpectation.Forbidden,
                "ArchLucid.Integrations.AzureDevOps must not declare a ProjectReference to Application."),

            ["Api csproj must not reference Integrations.AzureExtractor"] = new(
                "ArchLucid.Api",
                ["ArchLucid.Integrations.AzureExtractor"],
                ArchitectureReferenceExpectation.Forbidden,
                "TB-028: Api reaches AzureExtractor via Host.Composition only."),

            ["Api csproj must not reference Decisioning"] = new(
                "ArchLucid.Api",
                ["ArchLucid.Decisioning"],
                ArchitectureReferenceExpectation.Forbidden,
                "Api must reach decisioning through Application orchestration, not a direct csproj reference (INV host seam)."),

            ["Api csproj must not reference KnowledgeGraph"] = new(
                "ArchLucid.Api",
                ["ArchLucid.KnowledgeGraph"],
                ArchitectureReferenceExpectation.Forbidden,
                "Api must depend on graph ports in Contracts/Core, not a direct KnowledgeGraph csproj reference."),

            ["Decisioning csproj must not reference Notifications"] = new(
                "ArchLucid.Decisioning",
                ["ArchLucid.Notifications"],
                ArchitectureReferenceExpectation.Forbidden,
                "Decisioning must not depend on notification infrastructure (TB-029); webhook channels live in ArchLucid.Notifications."),

            ["Persistence csproj must not reference Provenance or Capabilities.Cost"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Provenance", "ArchLucid.Capabilities.Cost"],
                ArchitectureReferenceExpectation.Forbidden,
                "Persistence must use Contracts ports and Application orchestration; provenance graphs and cost agents stay in the domain tier (Improvement #16)."),

            ["Provenance csproj references ArtifactSynthesis, Decisioning, and KnowledgeGraph by design"] = new(
                "ArchLucid.Provenance",
                ["ArchLucid.ArtifactSynthesis", "ArchLucid.Decisioning", "ArchLucid.KnowledgeGraph"],
                ArchitectureReferenceExpectation.Required,
                "ProvenanceBuilder ingests synthesized artifacts, decision traces, and graph snapshot nodes in-process; port-based projection is tracked under Improvement #55."),

            ["Retrieval csproj references Decisioning, ArtifactSynthesis, and Provenance by design"] = new(
                "ArchLucid.Retrieval",
                ["ArchLucid.Decisioning", "ArchLucid.ArtifactSynthesis", "ArchLucid.Provenance"],
                ArchitectureReferenceExpectation.Required,
                "Retrieval chunking and indexing consume those domain models in-process; Contracts port inversion is tracked under Improvement #55 Option B."),
        };

        return rules;
    }
}
