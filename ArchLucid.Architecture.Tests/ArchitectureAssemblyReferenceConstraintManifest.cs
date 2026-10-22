namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Compiled assembly-metadata rules, keyed by the rule sentence that appears in CI output. Used where
///     NetArchTest namespace prefixes would false-positive on ports that live in a different assembly than
///     their namespace suggests (for example <c>ArchLucid.Persistence.*</c> ports compiled into <c>ArchLucid.Core</c>).
/// </summary>
internal static class ArchitectureAssemblyReferenceConstraintManifest
{
    internal static readonly IReadOnlyDictionary<string, AssemblyReferenceConstraint> Rules = Build();

    internal static AssemblyReferenceConstraint Rule(string ruleName)
        => ArchitectureConstraintManifestLookup.Rule(Rules, ruleName);

    private static IReadOnlyDictionary<string, AssemblyReferenceConstraint> Build()
    {
        Dictionary<string, AssemblyReferenceConstraint> rules = new(StringComparer.Ordinal)
        {
            ["Core must not reference the Persistence assembly"] = new(
                "ArchLucid.Core",
                ["ArchLucid.Persistence"],
                ArchitectureReferenceExpectation.Forbidden,
                "Core holds persistence port interfaces under ArchLucid.Persistence.* namespaces but must not reference the Persistence implementation assembly."),

            ["Core must not reference the Notifications assembly"] = new(
                "ArchLucid.Core",
                ["ArchLucid.Notifications"],
                ArchitectureReferenceExpectation.Forbidden,
                "Core is the foundation leaf; webhook contracts live in ArchLucid.Notifications without a Core assembly reference."),

            ["Contracts must not reference the Notifications assembly"] = new(
                "ArchLucid.Contracts",
                ["ArchLucid.Notifications"],
                ArchitectureReferenceExpectation.Forbidden,
                "Contracts stays a shared DTO leaf; outbound HTTP posting is not a Contracts concern."),

            ["Application references the Core assembly for the consolidated audit event catalog"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Core"],
                ArchitectureReferenceExpectation.Required,
                "Application orchestrators use ArchLucid.Core.Audit.AuditEventTypes.Baseline for trusted-baseline mutation strings (single catalog with durable AuditEventTypes)."),

            ["Application must not reference the Persistence assembly"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Persistence"],
                ArchitectureReferenceExpectation.Forbidden,
                "Application must depend on repository ports in Contracts, not the Persistence assembly."),

            ["Application must not reference the AgentSimulator assembly"] = new(
                "ArchLucid.Application",
                ["ArchLucid.AgentSimulator"],
                ArchitectureReferenceExpectation.Forbidden,
                "IAgentExecutor lives in Contracts.Abstractions; Application must not depend on the simulator package."),

            ["Application must not reference the Host.Composition assembly"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Host.Composition"],
                ArchitectureReferenceExpectation.Forbidden,
                "Application stays host-agnostic; composition is a host concern."),

            ["Application must not reference the Integrations.AzureExtractor assembly"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Integrations.AzureExtractor"],
                ArchitectureReferenceExpectation.Forbidden,
                "Application must not reference Integrations.AzureExtractor directly; use ports in Contracts."),

            ["Application must not reference the Notifications assembly"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Notifications"],
                ArchitectureReferenceExpectation.Forbidden,
                "Application must dispatch alerts through orchestration ports, not reference the Notifications delivery assembly directly."),

            ["Application must not reference SqlClient or Dapper"] = new(
                "ArchLucid.Application",
                ["Microsoft.Data.SqlClient", "Dapper"],
                ArchitectureReferenceExpectation.Forbidden,
                "Application orchestrates use cases; Microsoft.Data.SqlClient and Dapper belong in ArchLucid.Persistence only."),

            ["Cli must not reference the Api host assembly"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Api"],
                ArchitectureReferenceExpectation.Forbidden,
                // NetArchTest HaveDependencyOn("ArchLucid.Api") also matches ArchLucid.Api.Client.*, so the host boundary is enforced via metadata.
                "The CLI must not reference the ASP.NET host assembly; HTTP types come from ArchLucid.Api.Client only."),

            ["Cli must not reference the Coordinator assembly"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Coordinator"],
                ArchitectureReferenceExpectation.Forbidden,
                "Cli must not pull in domain orchestration layers; HTTP transport via Api.Client is the correct boundary."),

            ["Cli references the Application assembly for the offline pdf render pipeline"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Application"],
                ArchitectureReferenceExpectation.Required,
                "TB-723 `archlucid docs pdf render` hosts ProductDocumentationPdfBuilder from Application.Pilots."),

            ["Cli must not reference deeper product layers"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Persistence", "ArchLucid.Decisioning", "ArchLucid.Host.Core"],
                ArchitectureReferenceExpectation.Forbidden,
                "Cli must remain a thin host; deeper layers belong behind Api.Client or the pdf render exception only."),

            ["Retrieval must not reference the Persistence assembly"] = new(
                "ArchLucid.Retrieval",
                ["ArchLucid.Persistence"],
                ArchitectureReferenceExpectation.Forbidden,
                // Namespace matching false-positives on Core-hosted persistence ports (ArchLucid.Persistence.* shims compiled into ArchLucid.Core).
                "Retrieval stays above SQL/Dapper; depend on persistence ports in Core, not the Persistence implementation assembly."),

            ["Retrieval must not reference the Api assembly"] = new(
                "ArchLucid.Retrieval",
                ["ArchLucid.Api"],
                ArchitectureReferenceExpectation.Forbidden,
                "Retrieval must stay below the HTTP host; API depends on retrieval ports in Core, not the reverse."),

            ["Api must not reference the Retrieval assembly"] = new(
                "ArchLucid.Api",
                ["ArchLucid.Retrieval"],
                ArchitectureReferenceExpectation.Forbidden,
                // HaveDependencyOn("ArchLucid.Retrieval") also matches ArchLucid.Core.Retrieval.* port types (IRetrievalQueryService, RetrievalHit, ...).
                "Api must depend on retrieval ports in Core, not the Retrieval implementation assembly."),

            ["Worker must not reference the Api assembly"] = new(
                "ArchLucid.Worker",
                ["ArchLucid.Api"],
                ArchitectureReferenceExpectation.Forbidden,
                "Worker composes Host paths and contracts; it must not reference the HTTP host assembly."),

            ["AgentRuntime must not reference the Persistence assembly"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Persistence"],
                ArchitectureReferenceExpectation.Forbidden,
                "AgentRuntime must use ports, not the Persistence assembly."),

            ["AgentRuntime must not reference the AgentSimulator assembly"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.AgentSimulator"],
                ArchitectureReferenceExpectation.Forbidden,
                "TB-027: AgentRuntime depends on IAgentExecutor and Core deterministic scenarios only; AgentSimulator is wired at Host.Composition."),

            ["AgentRuntime must not reference host or infrastructure root assemblies"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Api", "ArchLucid.Host.Composition", "ArchLucid.Host.Core", "ArchLucid.Worker"],
                ArchitectureReferenceExpectation.Forbidden,
                "AgentRuntime executes in-process agents and must not depend on host roots."),

            ["AgentRuntime references the Decisioning assembly by design"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Decisioning"],
                ArchitectureReferenceExpectation.Required,
                // Pinning documents intentional coupling pending #55 port inversion.
                "AgentRuntime currently references Decisioning for in-process agent evaluation; refactor to Application ports is tracked under Improvement #55."),

            ["AgentRuntime references the Provenance assembly by design"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Provenance"],
                ArchitectureReferenceExpectation.Required,
                "AgentRuntime currently references Provenance for run-time provenance assembly; port inversion is tracked under Improvement #55."),

            ["Backfill.Cli references the Persistence assembly by design"] = new(
                "ArchLucid.Backfill.Cli",
                ["ArchLucid.Persistence"],
                ArchitectureReferenceExpectation.Required,
                "Backfill.Cli is a deliberate maintenance host over Persistence adapters; see docs/library/SqlRelationalBackfill.md."),
        };

        return rules;
    }
}
