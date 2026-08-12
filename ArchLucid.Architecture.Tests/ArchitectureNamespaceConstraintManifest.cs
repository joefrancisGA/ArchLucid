namespace ArchLucid.Architecture.Tests;

/// <summary>
///     NetArchTest namespace-dependency rules, keyed by the rule sentence that appears in CI output.
///     Add a row here rather than a new test method; the duplicate-key check is the manifest's own guard.
/// </summary>
internal static class ArchitectureNamespaceConstraintManifest
{
    internal static readonly IReadOnlyDictionary<string, NamespaceDependencyConstraint> Rules = Build();

    internal static NamespaceDependencyConstraint Rule(string ruleName)
        => ArchitectureConstraintManifestLookup.Rule(Rules, ruleName);

    private static IReadOnlyDictionary<string, NamespaceDependencyConstraint> Build()
    {
        Dictionary<string, NamespaceDependencyConstraint> rules = new(StringComparer.Ordinal)
        {
            ["Core must not depend on other first-party areas"] = new(
                "ArchLucid.Core",
                ArchitectureConstraintNamespaces.ForbiddenFromCoreExcludingPersistencePortShims,
                "ArchLucid.Core is the foundation leaf; referencing other ArchLucid assemblies couples infrastructure and domain into the kernel.")
            {
                // Configuration POCOs named *KnowledgeGraph* false-positive on the ArchLucid.KnowledgeGraph prefix (no assembly reference).
                ExcludedTypeNames = ["KnowledgeGraphLimitsOptions", "KnowledgeGraphProjectionCacheOptions"],
            },

            ["Contracts must not depend on other first-party areas"] = new(
                "ArchLucid.Contracts",
                ArchitectureConstraintNamespaces.ForbiddenFromContracts,
                "ArchLucid.Contracts is a shared DTO leaf; it must not reference application, persistence, or hosts."),

            ["Decisioning must not depend on Persistence"] = new(
                "ArchLucid.Decisioning",
                ["ArchLucid.Persistence"],
                "Decisioning is domain logic; any ArchLucid.Persistence dependency (base or sub-module) breaks hexagonal isolation."),

            ["Decisioning must not depend on ArtifactSynthesis"] = new(
                "ArchLucid.Decisioning",
                ["ArchLucid.ArtifactSynthesis"],
                "TB-031 Option A: ArtifactSynthesis sits above Decisioning; a reverse dependency would risk cycles."),

            ["Notifications must not depend on Persistence"] = new(
                "ArchLucid.Notifications",
                ["ArchLucid.Persistence"],
                "Notifications is a thin outbound-delivery contract assembly; SQL/Dapper must stay in persistence."),

            ["KnowledgeGraph must not depend on Persistence"] = new(
                "ArchLucid.KnowledgeGraph",
                ["ArchLucid.Persistence"],
                "KnowledgeGraph stays in the domain/application seam without SQL/Dapper types."),

            ["ContextIngestion must not depend on Persistence"] = new(
                "ArchLucid.ContextIngestion",
                ["ArchLucid.Persistence"],
                "Context ingestion models documents and must not reference persistence implementations."),

            ["ArtifactSynthesis must not depend on Persistence"] = new(
                "ArchLucid.ArtifactSynthesis",
                ["ArchLucid.Persistence"],
                "Artifact synthesis generates outputs from domain inputs and must not touch persistence."),

            ["Provenance must not depend on Persistence"] = new(
                "ArchLucid.Provenance",
                ["ArchLucid.Persistence"],
                "Provenance is domain logic; SQL/Dapper types belong in persistence adapters only (INV hexagonal tier-3 guard)."),

            ["Capabilities.Cost must not depend on Persistence"] = new(
                "ArchLucid.Capabilities.Cost",
                ["ArchLucid.Persistence"],
                "Capabilities.Cost is domain-tier logic and must not reference ArchLucid.Persistence (INV hexagonal tier-3 guard)."),

            ["Cli must not depend on Persistence"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Persistence"],
                "The CLI is a thin host over HTTP clients and contracts; it must not embed persistence."),

            ["Cli must not depend on Decisioning"] = new(
                "ArchLucid.Cli",
                ["ArchLucid.Decisioning"],
                "Cli must not depend on Decisioning."),

            ["Persistence must not depend on Retrieval"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Retrieval"],
                "Persistence must not reference Retrieval; Coordination owns that edge."),

            ["Persistence must not depend on Decisioning"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Decisioning"],
                "Persistence must not reference Decisioning domain assemblies."),

            ["Persistence must not depend on ArtifactSynthesis"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.ArtifactSynthesis"],
                "Persistence must not reference ArtifactSynthesis."),

            ["Persistence must not depend on ContextIngestion"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.ContextIngestion"],
                "Persistence must not reference ContextIngestion."),

            ["Persistence must not depend on KnowledgeGraph"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.KnowledgeGraph"],
                "Persistence must not reference KnowledgeGraph."),

            ["Persistence must not depend on Provenance"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Provenance"],
                "Persistence must not reference Provenance (Improvement #16 hexagonal guard)."),

            ["Persistence must not depend on Capabilities.Cost"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Capabilities.Cost"],
                "Persistence must not reference Capabilities.Cost (Improvement #16 hexagonal guard)."),

            ["Persistence must not depend on Notifications"] = new(
                "ArchLucid.Persistence",
                ["ArchLucid.Notifications"],
                "Persistence must not reference Notifications."),

            ["Application must not depend on the Persistence.Repositories implementation namespace"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Persistence.Repositories"],
                "Application depends on persistence ports (Interfaces, Models, Data.Repositories contracts); "
                + "Sql*/Caching* repository implementations belong in ArchLucid.Persistence.Repositories and composition only."),

            ["Application must not depend on the Api.Middleware namespace"] = new(
                "ArchLucid.Application",
                ["ArchLucid.Api.Middleware"],
                "HTTP middleware is composed only in ArchLucid.Api (see INV-001 tenant/host boundary sketch); "
                + "Application must not take a dependency on ArchLucid.Api.Middleware types."),

            ["AgentRuntime outside Explanation must not depend on Application"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Application"],
                "Only AgentRuntime.Explanation may implement Application.Explanation ports; "
                + "all other AgentRuntime types must not reference Application orchestration.")
            {
                // IExplanationService (Application.Explanation) and IRunExplanationSummaryService (Core.Explanation)
                // are the allowed adapter-to-port edges in hexagonal architecture.
                ExceptTypesInNamespace = "ArchLucid.AgentRuntime.Explanation",
            },

            ["AgentRuntime.Explanation must not depend on Application use-case namespaces"] = new(
                "ArchLucid.AgentRuntime",
                [
                    "ArchLucid.Application.Runs",
                    "ArchLucid.Application.Advisory",
                    "ArchLucid.Application.Analysis",
                    "ArchLucid.Application.Governance",
                    "ArchLucid.Application.GoldenCohort",
                    "ArchLucid.Application.Pilots",
                    "ArchLucid.Application.Notifications",
                    "ArchLucid.Application.Marketing",
                    "ArchLucid.Application.Common",
                ],
                "AgentRuntime.Explanation may implement Application.Explanation port interfaces only; "
                + "it must not reach into Application orchestration or use-case namespaces.")
            {
                // Positive complement of "AgentRuntime outside Explanation must not depend on Application".
                OnlyTypesInNamespace = "ArchLucid.AgentRuntime.Explanation",
            },

            ["AgentRuntime must not depend on the Persistence.Repositories implementation namespace"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Persistence.Repositories"],
                "AgentRuntime may use persistence query/trace ports but must not reference concrete repository types "
                + "under ArchLucid.Persistence.Repositories (the host registers those adapters)."),

            ["AgentRuntime must not depend on Application.Evidence or Application.Budgeting"] = new(
                "ArchLucid.AgentRuntime",
                ["ArchLucid.Application.Evidence", "ArchLucid.Application.Budgeting"],
                "Evidence and budgeting ports live in ArchLucid.Core; Application orchestration must not leak into AgentRuntime."),

            ["Api must not depend on AgentRuntime"] = new(
                "ArchLucid.Api",
                ["ArchLucid.AgentRuntime"],
                "API reaches agents via Application and host DI only."),

            ["Api must not depend on Decisioning"] = new(
                "ArchLucid.Api",
                ["ArchLucid.Decisioning"],
                "Api must not depend on Decisioning.")
            {
                ExcludedTypeNames = ["ExplanationController", "AdvisorySchedulingController"],
            },

            ["Api must not depend on KnowledgeGraph"] = new(
                "ArchLucid.Api",
                ["ArchLucid.KnowledgeGraph"],
                "Api must not depend on KnowledgeGraph."),

            ["Mcp must not depend on Application"] = new(
                "ArchLucid.Mcp",
                ["ArchLucid.Application"],
                "Mcp tools delegate to Retrieval/Core ports only."),

            ["Mcp must not depend on Persistence"] = new(
                "ArchLucid.Mcp",
                ["ArchLucid.Persistence"],
                "Mcp must stay above SQL/Dapper."),

            ["Integrations.AzureExtractor must not depend on Application"] = new(
                "ArchLucid.Integrations.AzureExtractor",
                ["ArchLucid.Application"],
                "ArchLucid.Integrations.AzureExtractor is an infrastructure adapter and must not reference Application."),

            ["Integrations.AzureDevOps must not depend on Application"] = new(
                "ArchLucid.Integrations.AzureDevOps",
                ["ArchLucid.Application"],
                "ArchLucid.Integrations.AzureDevOps is an infrastructure adapter and must not reference Application."),

            ["Jobs.Cli must not depend on Application"] = new(
                "ArchLucid.Jobs.Cli",
                ["ArchLucid.Application"],
                "Jobs.Cli must reach Application only via Host.Composition."),

            ["Notifications.Email.RazorLight must not depend on Application"] = new(
                "ArchLucid.Notifications.Email.RazorLight",
                ["ArchLucid.Application"],
                "The email template adapter stays at the infrastructure tier."),

            ["Backfill.Cli must not depend on Application"] = new(
                "ArchLucid.Backfill.Cli",
                ["ArchLucid.Application"],
                "Backfill.Cli is a maintenance host over Persistence.Coordination.Backfill, not an Application use-case."),
        };

        return rules;
    }
}
